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
