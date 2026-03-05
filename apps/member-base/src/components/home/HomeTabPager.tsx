/**
 * HomeTabPager
 * Horizontal paging ScrollView for home tabs with lazy render and custom renderTab.
 */
import React from 'react';
import { View, Animated } from 'react-native';
import type { Tab } from '@core/config';

interface HomeTabPagerProps {
  tabs: Tab[];
  activeTab: string;
  layoutWidth: number;
  scrollX: Animated.Value;
  pagerRef: React.RefObject<any>;
  /** Panggil saat pager terukur; pakai untuk layoutWidth supaya snap & scroll pas */
  onPagerLayout?: (width: number) => void;
  /** Cancel pending programmatic scroll when user starts dragging */
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: (event: any) => void;
  onMomentumScrollEnd: (event: any) => void;
  shouldRenderTab: (tabId: string, index: number) => boolean;
  renderTab: (tabId: string, index: number) => React.ReactNode;
}

export const HomeTabPager: React.FC<HomeTabPagerProps> = ({
  tabs,
  activeTab,
  layoutWidth,
  scrollX,
  pagerRef,
  onPagerLayout,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  shouldRenderTab,
  renderTab,
}) => {
  const lastReportedWidthRef = React.useRef(0);
  const handleLayout = React.useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0 && w !== lastReportedWidthRef.current) {
        lastReportedWidthRef.current = w;
        onPagerLayout?.(w);
      }
    },
    [onPagerLayout],
  );

  const snapOffsets =
    layoutWidth > 0 && tabs.length > 0
      ? tabs.map((_, i) => i * layoutWidth)
      : undefined;

  return (
    <Animated.ScrollView
      ref={pagerRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      decelerationRate="fast"
      snapToOffsets={snapOffsets}
      snapToInterval={!snapOffsets && layoutWidth > 0 ? layoutWidth : undefined}
      snapToAlignment="start"
      removeClippedSubviews={false}
      onLayout={handleLayout}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      })}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {tabs.map((tab, index) => {
        const pageStyle = { width: layoutWidth, minWidth: layoutWidth, flex: 1 };
        if (!shouldRenderTab(tab.id, index)) {
          return (
            <View key={tab.id} style={pageStyle} pointerEvents="box-none" />
          );
        }
        return (
          <View key={tab.id} style={pageStyle} pointerEvents="box-none">
            {renderTab(tab.id, index)}
          </View>
        );
      })}
    </Animated.ScrollView>
  );
};
