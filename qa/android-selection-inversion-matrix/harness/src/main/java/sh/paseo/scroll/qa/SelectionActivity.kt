package sh.paseo.scroll.qa

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.scroll.ReactScrollViewManager
import com.facebook.soloader.SoLoader
import sh.paseo.scroll.PaseoScrollPackage

class SelectionActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    SoLoader.init(this, OpenSourceMergedSoMapping)
    com.facebook.react.uimanager.DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(this)
    val reactContext = BridgeReactContext(this)
    val context = ThemedReactContext(reactContext, this)
    val manager = PaseoScrollPackage().createViewManager(reactContext, ReactScrollViewManager.REACT_CLASS) as ReactScrollViewManager
    val scroll = manager.createViewInstance(context)
    val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(Color.WHITE) }
    val status = TextView(this).apply { textSize = 16f; setTextColor(Color.BLACK); setPadding(30, 20, 30, 20) }
    root.addView(status)
    root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
    val content = FrameLayout(this).apply { scaleX = -1f; scaleY = -1f }
    for (i in 1..18) {
      val text = TextView(this).apply {
        textSize = 18f; setTextColor(Color.BLACK)
        text = "$i. Selectable reading text. Long press these words and drag the system handles. The viewport should stay in place."
        setTextIsSelectable(true)
      }
      content.addView(text, FrameLayout.LayoutParams(-1, 140).apply { topMargin = (i - 1) * 180; leftMargin = 35; rightMargin = 35 })
    }
    scroll.addView(content, FrameLayout.LayoutParams(-1, 3300))
    scroll.setOnScrollChangeListener { _, _, y, _, _ -> status.text = "Android inverted selection QA — scrollY=$y" }
    setContentView(root)
    scroll.post {
      content.measure(android.view.View.MeasureSpec.makeMeasureSpec(scroll.width, android.view.View.MeasureSpec.EXACTLY), android.view.View.MeasureSpec.makeMeasureSpec(3300, android.view.View.MeasureSpec.EXACTLY))
      content.layout(0, 0, scroll.width, 3300)
      status.text = "Android inverted selection QA — scrollY=400"
      val transforms = JavaOnlyArray.of(JavaOnlyMap.of("scale", -1.0))
      manager.updateProperties(scroll, ReactStylesDiffMap(JavaOnlyMap.of("transform", transforms)))
      scroll.scrollTo(0, 400)
    }
  }
}
