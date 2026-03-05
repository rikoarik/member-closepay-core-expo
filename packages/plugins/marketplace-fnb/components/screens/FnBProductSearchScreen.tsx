/**
 * FnBProductSearchScreen – Search products/merchants (concept like StoreProductSearch).
 * Back + search bar + recommendations; submit or tap recommendation → FnBProductSearchResults.
 */

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SearchNormal, CloseCircle, Chart, ArrowLeft2 } from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  getResponsiveFontSize,
  FontFamily,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import { FNBDISCOVERY_RECOMMENDATIONS } from "../../data/fnbDiscoveryMerchants";

export const FnBProductSearchScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const searchInputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    (navigation as { navigate: (name: string, params?: { query: string }) => void }).navigate(
      "FnBProductSearchResults",
      { query: q || "" }
    );
  }, [navigation, searchQuery]);

  const handleRecommendationPress = useCallback(
    (term: string) => {
      (navigation as { navigate: (name: string, params?: { query: string }) => void }).navigate(
        "FnBProductSearchResults",
        { query: term }
      );
    },
    [navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.customHeader,
          {
            paddingTop: insets.top,
            paddingHorizontal: horizontalPadding,
            paddingBottom: moderateVerticalScale(12),
            backgroundColor: colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.background || colors.surface },
          ]}
        >
          <SearchNormal size={scale(20)} color={colors.primary} variant="Linear" />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t("fnb.searchCraving")}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            multiline={false}
            numberOfLines={1}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <CloseCircle
                size={scale(20)}
                color={colors.textSecondary}
                variant="Linear"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{
          paddingBottom: insets.bottom + moderateVerticalScale(20),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <View style={[styles.section, { marginTop: moderateVerticalScale(16) }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Chart size={scale(20)} color={colors.primary} variant="Linear" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("fnb.searchRecommendations")}
              </Text>
            </View>
          </View>
          <View style={styles.recommendationsContainer}>
            {FNBDISCOVERY_RECOMMENDATIONS.map((term, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.recommendationItem,
                  {
                    backgroundColor:
                      colors.primaryLight || colors.surface,
                  },
                ]}
                onPress={() => handleRecommendationPress(term)}
              >
                <Text
                  style={[styles.recommendationText, { color: colors.primary }]}
                >
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  backButton: {
    padding: scale(4),
    justifyContent: "center",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    height: scale(40),
    borderRadius: scale(20),
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontFamily: FontFamily.monasans.regular,
    fontSize: getResponsiveFontSize("small"),
  },
  clearButton: {
    padding: scale(4),
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  section: {
    paddingHorizontal: getHorizontalPadding(),
    marginBottom: moderateVerticalScale(24),
    marginTop: moderateVerticalScale(16),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateVerticalScale(12),
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize("large"),
    fontFamily: FontFamily.monasans.semiBold,
  },
  recommendationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  recommendationItem: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateVerticalScale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "transparent",
  },
  recommendationText: {
    fontSize: getResponsiveFontSize("medium"),
    fontFamily: FontFamily.monasans.medium,
  },
});

export default FnBProductSearchScreen;
