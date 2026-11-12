package sh.paseo.framerate

internal data class DisplayModeSpec(val width: Int, val height: Int, val refreshRate: Float)

internal fun peakRefreshRate(modes: List<DisplayModeSpec>, current: DisplayModeSpec): Float? =
  modes.filter { it.width == current.width && it.height == current.height }.maxOfOrNull { it.refreshRate }

internal fun isColorOsFamily(manufacturer: String, brand: String): Boolean {
  val identity = "$manufacturer $brand".lowercase()
  return listOf("oppo", "oneplus", "oplus", "realme").any { identity.contains(it) }
}
