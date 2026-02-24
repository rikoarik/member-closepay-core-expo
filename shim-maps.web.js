/**
 * Web stub for react-native-maps (not supported on web).
 * Metro resolves 'react-native-maps' to this file when platform is web.
 */
const React = require('react');
const { View, Text } = require('react-native');

function MapViewStub({ style, children, ...rest }) {
  return (
    <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, style]} {...rest}>
      <Text style={{ color: '#666', fontSize: 14 }}>Map not available on web</Text>
      {children}
    </View>
  );
}

module.exports = MapViewStub;
module.exports.default = MapViewStub;
