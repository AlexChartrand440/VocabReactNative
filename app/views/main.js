import React, { Component } from 'react';
import {
  Linking,
  ListView,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

// 3rd party libraries
import { Actions } from 'react-native-router-flux';
import { AdMobInterstitial } from 'react-native-admob';
import { InterstitialAdManager, NativeAdsManager } from 'react-native-fbads';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NavigationBar from 'react-native-navbar';
import timer from 'react-native-timer';

// Component
import AdBanner from './ad-banner';
import FbAds from './fbads';
import Rating from './rating';

import commonStyle from '../common-styles';
import tracker from '../tracker';

import { config } from '../config';

// Data
import { lessons } from '../data/lessons';

const adsManager = new NativeAdsManager(config.fbads[Platform.OS].native);

const styles = StyleSheet.create(Object.assign({}, commonStyle, {
  row: {
    padding: 15,
    paddingLeft: 20,
    marginHorizontal: 12,
    marginVertical: 5,
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderRightColor: '#CCCCCC',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#CCCCCC',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '200',
    lineHeight: 26,
  },
  paginationView: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
}));

export default class MainView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dataSource: new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 }),
    };
  }

  componentDidMount() {
    this.prepareRows();

    timer.clearTimeout(this);

    InterstitialAdManager.showAd(config.fbads[Platform.OS].interstital)
      .then((didClick) => {
        console.log('Facebook Interstitial Ad', didClick);
      })
      .catch((error) => {
        console.log('Facebook Interstitial Ad Failed', error);
        AdMobInterstitial.requestAd(() => AdMobInterstitial.showAd(error1 => error1 && console.log(error1)));
      });

    timer.setTimeout(this, 'AudienceInterstitial', () => {
      InterstitialAdManager.showAd(config.fbads[Platform.OS].interstital)
        .then((didClick) => {
          console.log('Facebook Interstitial Ad', didClick);
        })
        .catch((error) => {
          console.log('Facebook Interstitial Ad Failed', error);
          AdMobInterstitial.requestAd(() => AdMobInterstitial.showAd(error1 => error1 && console.log(error1)));
        });
    }, 10 * 60 * 1000);
  }

  componentWillUnmount() {
    timer.clearTimeout(this);
  }

  onActionSelected(position) {
    if (position === 0) {  // index of 'Info'
      Actions.info();
    }
  }

  prepareRows() {
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(lessons),
    });
  }

  renderRowView(rowData, rowId) {
    return (
      <View>
        <TouchableHighlight
          underlayColor="#F5F5F5"
          style={styles.row}
          onPress={() => {
            Actions.lesson(rowData);
            tracker.trackEvent('user-action', 'open-lesson', { label: rowData.title });
          }}
        >
          <View>
            <Text style={styles.title}>{rowData.title}</Text>
            <Text style={styles.subtitle}>{rowData.entitle}</Text>
            <Text style={styles.subtitle}>{rowData.thtitle}</Text>
          </View>
        </TouchableHighlight>
        {rowId === '1' && <Rating />}
        {rowId % 20 === 1 && <FbAds adsManager={adsManager} />}
      </View>
    );
  }

  renderToolbar() {
    if (Platform.OS === 'ios') {
      return (
        <NavigationBar
          statusBar={{ style: 'light-content', tintColor: '#4CAF50' }}
          style={styles.navigatorBarIOS}
          title={{ title: this.props.title, tintColor: 'white' }}
          rightButton={
            <TouchableOpacity onPress={Actions.info}>
              <Icon style={styles.navigatorRightButton} name="info" size={26} color="white" />
            </TouchableOpacity>
          }
        />
      );
    } else if (Platform.OS === 'android') {
      return (
        <Icon.ToolbarAndroid
          style={styles.toolbar}
          title={this.props.title}
          titleColor="white"
          actions={[
            { title: 'Info', iconName: 'info', iconSize: 26, show: 'always' },
          ]}
          onActionSelected={position => this.onActionSelected(position)}
        />
      );
    }
  }

  render() {
    tracker.trackScreenView('main');
    return (
      <View style={styles.container}>
        {this.renderToolbar()}
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData, secId, rowId) => this.renderRowView(rowData, rowId)}
          renderFooter={() => (<View>
            <FbAds adsManager={adsManager} />

            <TouchableOpacity
              onPress={() => {
                Linking.openURL('https://goo.gl/forms/noB7jUptpyYFGdr63');
                tracker.trackEvent('user-action', 'open-url', { label: 'open-feedback' });
              }}
            >
              <View style={[styles.row, { backgroundColor: '#C8E6C9' }]}>
                <Text>任何意見我們都會聆聽。跟我們說說吧！</Text>
                <Text>Any suggestions? Click here and tell us!</Text>
              </View>
            </TouchableOpacity>
          </View>)}
        />
        <AdBanner />
      </View>
    );
  }
}

MainView.propTypes = {
  title: React.PropTypes.string,
};

MainView.defaultProps = {
  title: '',
};
