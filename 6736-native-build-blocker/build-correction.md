# Build correction 1

First xcodebuild exited65 before Metro/current app runtime. Raw build/xcode.log contains:

`error: precompiled file '.../6736-native/DerivedData/ModuleCache.noindex/.../SwiftShims-....pcm' was compiled with module cache path '.../7186-derived/ModuleCache.noindex/...', but the path is currently '.../6736-native/DerivedData/ModuleCache.noindex/...'`

This copied compiler cache contains absolute identity, so it cannot be relocated as a reusable fresh cache. Preserve the entire failed cloned DerivedData and build log; second build uses a new empty DerivedData-fresh with unchanged candidate source, generated iOS path relocations, installed Pods, dependency versions, Metro normalizer and flags. This is one evidence-based environment correction, not a product fix or native acceptance result. No third attempt for the same defect.
