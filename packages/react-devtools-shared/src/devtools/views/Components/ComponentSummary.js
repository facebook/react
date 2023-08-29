import React, {useContext, useMemo} from 'react';
import {FixedSizeList} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Tooltip from '@reach/tooltip';
import {StoreContext} from '../context';
import {SettingsContext} from '../Settings/SettingsContext';
import {useSubscription} from '../hooks';
import styles from './ComponentSummary.css';
import tooltipStyles from '../Components/reach-ui/Tooltip.css';

type ListItem = {|
  componentName: string,
  instanceCount: number,
|};

export default function ComponentSummary(props: Props) {
  const store = useContext(StoreContext);

  const allElementsSubscription = useMemo(
    () => ({
      getCurrentValue: () => {
        const components = store
          .getAllElements()
          .reduce((allComponents, element) => {
            const component = allComponents.find(
              ({componentName}) => componentName === element.displayName,
            );
            if (component) {
              component.instanceCount += 1;
            } else {
              allComponents.push({
                componentName: element.displayName,
                instanceCount: 1,
              });
            }

            return allComponents;
          }, []);

        components.sort(
          (
            {instanceCount: count1, componentName: componentName1},
            {instanceCount: count2, componentName: componentName2},
          ) =>
            count1 === count2
              ? componentName1.localeCompare(componentName2)
              : count2 - count1,
        );

        return components;
      },
      subscribe: (callback: Function) => {
        store.addListener('mutated', callback);
        return () => store.removeListener('mutated', callback);
      },
    }),
    [store],
  );

  const items = useSubscription(allElementsSubscription);

  return (
    <div className={styles.Container}>
      <AutoSizer>
        {({height, width}) => (
          <ComponentInstanceList items={items} height={height} width={width} />
        )}
      </AutoSizer>
    </div>
  );
}

type ListProps = {|
  height: number,
  width: number,
  items: Array<ListItem>,
|};

function ComponentInstanceList({height, width, items}: ListProps) {
  const {lineHeight} = useContext(SettingsContext);
  return (
    <FixedSizeList
      className={styles.SummaryList}
      height={height}
      innerElementType="div"
      itemCount={items.length}
      itemData={items}
      itemSize={lineHeight}
      width={width}>
      {ComponentInstanceListItem}
    </FixedSizeList>
  );
}

type ListItemProps = {
  data: Array<ListItem>,
  index: number,
  style: Object,
};

function ComponentInstanceListItem(props: ListItemProps) {
  const {index, data, style} = props;
  const {componentName, instanceCount} = data[index];
  const title = `${componentName} has ${instanceCount} instance${
    instanceCount > 1 ? 's' : ''
  } mounted`;

  return (
    <div className={styles.ComponentLine} style={style}>
      <div className={styles.ComponentName}>{componentName}</div>
      <Tooltip label={title} className={tooltipStyles.Tooltip}>
        <span className={styles.InstanceCount}>{instanceCount}</span>
      </Tooltip>
    </div>
  );
}
