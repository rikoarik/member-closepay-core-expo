/**
 * Web stub for react-native-linear-gradient (avoids requireNativeComponent).
 * Used when Metro resolves 'react-native-linear-gradient' for web.
 */
const React = require('react');
const { View } = require('react-native');

function LinearGradient({ colors, start, end, style, children, ...rest }) {
  const [first = '#000', second = '#fff'] = colors || [];
  const angle = start && end
    ? Math.atan2((end.y - start.y) || 0, (end.x - start.x) || 0) * (180 / Math.PI) + 90
    : 90;
  return (
    <View
      style={[
        style,
        {
          backgroundImage: `linear-gradient(${angle}deg, ${first}, ${second})`,
        },
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

module.exports = LinearGradient;
module.exports.LinearGradient = LinearGradient;
