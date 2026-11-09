package sh.paseo.framerate

import android.app.Activity
import android.hardware.display.DisplayManager
import android.os.Build
import android.util.Log
import android.view.Display
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val TAG = "PaseoFrameRate"

/**
 * ColorOS/OxygenOS pick a window's refresh rate from a per-package table in `oplusscreenmode`
 * (`dumpsys oplusscreenmode`). A package missing from that table gets a 60 Hz ceiling that even
 * touch boost cannot exceed, and no layer-level vote changes it — `View.setRequestedFrameRate` and
 * `SurfaceControl.Transaction.setFrameRate` both reach SurfaceFlinger and are clipped by the range.
 * The policy does read the window's `preferredRefreshRate`, so this module raises that ceiling.
 *
 * Deliberately scoped to the OEM builds that behave this way. On AOSP a `preferredRefreshRate` is a
 * base-mode vote, which on a non-LTPO panel can hold 120 Hz while anything animates; other devices
 * keep their own policy rather than inheriting this workaround.
 *
 * It raises a ceiling and does not pin a floor: a static screen still falls back to the display's
 * idle rate (60 Hz measured on the OPD2501), and the peak returns on touch.
 */
class PaseoFrameRateModule : Module() {
  private var displayListener: DisplayManager.DisplayListener? = null
  /** The activity the listener applies the attribute to; a recreated activity replaces it. */
  private var listeningActivity: Activity? = null

  override fun definition() = ModuleDefinition {
    Name("PaseoFrameRate")

    OnActivityEntersForeground {
      val activity = appContext.currentActivity ?: return@OnActivityEntersForeground
      if (!isColorOsFamily()) return@OnActivityEntersForeground
      activity.runOnUiThread {
        preferPeakRefreshRate(activity)
        listenForModeChanges(activity)
      }
    }

    OnDestroy {
      val manager = appContext.reactContext?.getSystemService(DisplayManager::class.java)
      displayListener?.let { manager?.unregisterDisplayListener(it) }
      displayListener = null
      listeningActivity = null
    }
  }

  private fun listenForModeChanges(activity: Activity) {
    listeningActivity = activity
    if (displayListener != null) return
    val manager = activity.getSystemService(DisplayManager::class.java) ?: return
    val listener = object : DisplayManager.DisplayListener {
      override fun onDisplayAdded(displayId: Int) = Unit
      override fun onDisplayRemoved(displayId: Int) = Unit
      // A fold, an unfold or a resolution switch can change the peak without recreating the
      // activity, so the attribute has to be refreshed when the display reports a new mode.
      override fun onDisplayChanged(displayId: Int) {
        // The listener outlives the activity it was registered with; a recreated window is the one
        // that has to carry the attribute now.
        val target = listeningActivity ?: return
        if (displayId != currentDisplay(target)?.displayId) return
        target.runOnUiThread { preferPeakRefreshRate(target) }
      }
    }
    manager.registerDisplayListener(listener, null)
    displayListener = listener
  }

  private fun preferPeakRefreshRate(activity: Activity) {
    val display = currentDisplay(activity) ?: return
    val peak = peakRefreshRate(display) ?: return
    val attributes = activity.window.attributes
    if (attributes.preferredRefreshRate == peak) return
    attributes.preferredRefreshRate = peak
    activity.window.attributes = attributes
    Log.i(TAG, "preferredRefreshRate=$peak")
  }

  /** `Activity.display` is API 30; the module's minSdk is 29. */
  @Suppress("DEPRECATION")
  private fun currentDisplay(activity: Activity): Display? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) activity.display
    else activity.windowManager.defaultDisplay

  private fun peakRefreshRate(display: Display): Float? {
    val current = display.mode
    return display.supportedModes
      .filter {
        it.physicalWidth == current.physicalWidth && it.physicalHeight == current.physicalHeight
      }
      .maxOfOrNull { it.refreshRate }
  }

  private fun isColorOsFamily(): Boolean {
    val identity = "${Build.MANUFACTURER} ${Build.BRAND}".lowercase()
    return listOf("oppo", "oneplus", "oplus", "realme").any { identity.contains(it) }
  }
}
