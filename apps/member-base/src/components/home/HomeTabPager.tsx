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
  onMomentumScrollEnd,
  shouldRenderTab,
  renderTab,
}) => {
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
      snapToInterval={layoutWidth}
      removeClippedSubviews={false}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      })}
      onMomentumScrollEnd={onMomentumScrollEnd}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {tabs.map((tab, index) => {
        if (!shouldRenderTab(tab.id, index)) {
          return (
            <View key={tab.id} style={{ width: layoutWidth, flex: 1 }} pointerEvents="none" />
          );
        }
        return (
          <View
            key={tab.id}
            style={{ width: layoutWidth, flex: 1 }}
            pointerEvents={activeTab === tab.id ? 'auto' : 'none'}
          >
            {renderTab(tab.id, index)}
          </View>
        );
      })}
    </Animated.ScrollView>
  );
};
