
## Input

```javascript
// @flow
import fbt from 'fbt'
export default component VideoPlayerConfigDebugOverlay(
  ..._props: VideoDebugOverlayProps
) {
  const [currentFilter, setCurrentFilter] =
    useState<VideoPlayerConfigDebugOverlayFilter>('all');

  const [isOzOnly, setIsOzOnly] = useState<boolean>(true);

  const filters = {
    all: {
      buttonContent: (
        <fbt desc="Video Debug Tool: All Config Parameters">All</fbt>
      ),
      component: VideoPlayerAllConfigValuesDebugItem,
    },
    contextSensitive: {
      buttonContent: (
        <fbt desc="Video Debug Tool: Context-sensitive values">
          Context-sensitive values
        </fbt>
      ),
      component: VideoPlayerContextSensitiveConfigValuesDebugItem,
    },
    experiments: {
      buttonContent: (
        <fbt desc="Video Debug Tool: Config Parameters From Experiments">
          Values from experiments
        </fbt>
      ),
      component: VideoPlayerConfigValuesFromExperimentsDebugItem,
    },
  };

  const CurrentComponent = filters[currentFilter].component;

  return (
    <div className={stylex(styles.root)}>
      {Object.keys(filters).map(filter => (
        <button
          className={stylex(
            styles.button,
            currentFilter === filter && styles.selected,
          )}
          key={'videoDebugOverlay/' + filter}
          onClick={() => setCurrentFilter(filter)}>
          {filters[filter].buttonContent}
        </button>
      ))}
      <div className={stylex(styles.ozFilterContainer)}>
        <button onClick={() => setIsOzOnly(!isOzOnly)}>
          {isOzOnly ? (
            <fbt desc="Video Debug Overlay: Determines if only Oz parameters are displayed">
              Show non-Oz parameters
            </fbt>
          ) : (
            <fbt desc="Video Debug Overlay: Determines if only Oz parameters are displayed">
              Hide non-Oz parameters
            </fbt>
          )}
        </button>
      </div>
      <div className={stylex(styles.content)}>
        <CurrentComponent
          parameterFilter={
            isOzOnly
              ? (name: string) => name.startsWith(OZ_CONFIG_PREFIX)
              : null
          }
        />
      </div>
    </div>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";
export default function VideoPlayerConfigDebugOverlay(_props) {
  const $ = _c(16);

  const [currentFilter, setCurrentFilter] = useState("all");

  const [isOzOnly, setIsOzOnly] = useState(true);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      all: {
        buttonContent: fbt._("All", null, { hk: "1Wbb7I" }),
        component: VideoPlayerAllConfigValuesDebugItem,
      },
      contextSensitive: {
        buttonContent: fbt._("Context-sensitive values", null, {
          hk: "1KSbMF",
        }),
        component: VideoPlayerContextSensitiveConfigValuesDebugItem,
      },
      experiments: {
        buttonContent: fbt._("Values from experiments", null, { hk: "2xcIRT" }),
        component: VideoPlayerConfigValuesFromExperimentsDebugItem,
      },
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const filters = t0;

  const CurrentComponent = filters[currentFilter].component;
  let t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = stylex(styles.root);
    t2 = Object.keys(filters);
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  let t3;
  if ($[3] !== currentFilter) {
    t3 = t2.map((filter) => (
      <button
        className={stylex(
          styles.button,

          currentFilter === filter && styles.selected,
        )}
        key={"videoDebugOverlay/" + filter}
        onClick={() => setCurrentFilter(filter)}
      >
        {filters[filter].buttonContent}
      </button>
    ));
    $[3] = currentFilter;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = stylex(styles.ozFilterContainer);
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  let t5;
  if ($[6] !== isOzOnly) {
    t5 = (
      <div className={t4}>
        <button onClick={() => setIsOzOnly(!isOzOnly)}>
          {isOzOnly
            ? fbt._("Show non-Oz parameters", null, { hk: "1F7zJz" })
            : fbt._("Hide non-Oz parameters", null, { hk: "4yo6XN" })}
        </button>
      </div>
    );
    $[6] = isOzOnly;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  let t6;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = stylex(styles.content);
    $[8] = t6;
  } else {
    t6 = $[8];
  }

  const t7 = isOzOnly ? _temp : null;
  let t8;
  if ($[9] !== CurrentComponent || $[10] !== t7) {
    t8 = (
      <div className={t6}>
        <CurrentComponent parameterFilter={t7} />
      </div>
    );
    $[9] = CurrentComponent;
    $[10] = t7;
    $[11] = t8;
  } else {
    t8 = $[11];
  }
  let t9;
  if ($[12] !== t3 || $[13] !== t5 || $[14] !== t8) {
    t9 = (
      <div className={t1}>
        {t3}
        {t5}
        {t8}
      </div>
    );
    $[12] = t3;
    $[13] = t5;
    $[14] = t8;
    $[15] = t9;
  } else {
    t9 = $[15];
  }
  return t9;
}
function _temp(name) {
  return name.startsWith(OZ_CONFIG_PREFIX);
}

```
      
### Eval output
(kind: exception) Fixture not implemented