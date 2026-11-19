package sh.paseo.framerate

import org.junit.Assert.*
import org.junit.Test

class PeakRefreshRateTest {
  @Test fun selectsPeakAtCurrentResolution() {
    val current = DisplayModeSpec(1980, 2800, 60f)
    assertEquals(120f, peakRefreshRate(listOf(current, DisplayModeSpec(1980, 2800, 120f), DisplayModeSpec(720, 1600, 144f)), current))
    assertNull(peakRefreshRate(emptyList(), current))
  }

  @Test fun restrictsPolicyToColorOsFamily() {
    for (brand in listOf("OPPO", "OnePlus", "oplus", "realme")) assertTrue(isColorOsFamily(brand, brand))
    assertFalse(isColorOsFamily("Google", "google"))
    assertFalse(isColorOsFamily("Samsung", "samsung"))
  }
}
