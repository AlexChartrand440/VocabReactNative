import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 3rd party libraries
import _ from 'underscore';
import { Actions } from 'react-native-router-flux';
import { AdMobInterstitial } from 'react-native-admob';
import { IndicatorViewPager, PagerDotIndicator } from 'rn-viewpager';
import FlipCard from 'react-native-flip-card';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NavigationBar from 'react-native-navbar';
import Sound from 'react-native-sound';
import Speech from 'react-native-speech';
import Toast from 'react-native-root-toast';

// Component
import AdBanner from './ad-banner';
import AdmobCell from './admob';

import commonStyle from '../common-styles';
import tracker from '../tracker';

const styles = StyleSheet.create(Object.assign({}, commonStyle, {
  card: {
    flex: 1,
    margin: 10,
    backgroundColor: 'white',
    paddingBottom: 20,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderRightColor: '#CCCCCC',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBlock: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pronunciationText: {
    fontSize: 20,
    lineHeight: 36,
  },
  translationText: {
    fontSize: 26,
    lineHeight: 36,
  },
  selectDot: {
    backgroundColor: '#424242',
  },
}));

export default class CardView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      vocabulary: this.props.vocabulary,
      toastVisible: true,
    };
  }

  componentDidMount() {
    Speech.supportedVoices()
      .then((locales) => {
        console.log('Supported voices', locales);  // ["ar-SA", "en-ZA", "nl-BE", "en-AU", "th-TH", ...]
      });

    Toast.show('點擊以翻轉卡片\nTouch to flip the card', {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM - 60,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 1000,
    });
  }

  onActionSelected(position) {
    if (position === 0) {  // index of 'Shuffle'
      this.shuffle();
    }
  }

  onPlaySound(pageData) {
    if (Platform.OS === 'ios') {
      Speech.speak({
        text: pageData.word,
        voice: 'th-TH',
        rate: 0.2,
      });
    } else if (Platform.OS === 'android') {
      if (pageData.sound) {
        const s = new Sound(pageData.sound, Sound.MAIN_BUNDLE, (e) => {
          if (e) {
            console.log('error', e);
          } else {
            console.log('duration', s.getDuration());
            s.play();
          }
        });
      } else {
        Speech.speak({
          text: pageData.word,
          voice: 'th_TH',
          rate: 0.2,
          forceStop: true,
        });
      }
    }
    tracker.trackEvent('user-action', 'play-card-sound', { label: pageData.word });
  }

  shuffle() {
    this.setState({
      vocabulary: _.shuffle(this.state.vocabulary),
    });
    tracker.trackEvent('user-action', 'shuffle-card', { label: this.props.title });
  }

  popAndAd() {
    if (Math.random() > 0.96) {
      AdMobInterstitial.requestAd(() => AdMobInterstitial.showAd(error => error && console.log(error)));
    }
    Actions.pop();
  }

  renderPage(pageData, i) {
    return (
      <FlipCard
        key={i}
        friction={12}
        flipHorizontal={true}
        flipVertical={false}
        style={{ borderWidth: 0 }}
      >
        {/* Face Side */}
        <View style={styles.card}>
          <View style={styles.textBlock}>
            <Text style={{ fontSize: 120 - (6 * pageData.word.length) }}>{pageData.word}</Text>
          </View>
          <View style={styles.playBlock}>
            <TouchableOpacity onPress={() => this.onPlaySound(pageData)}>
              <Icon name="play-circle-filled" size={100} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Back Side */}
        <View style={styles.card}>
          <View style={styles.textBlock}>
            {pageData.pronunciation && <Text style={styles.pronunciationText}>{`/ ${pageData.pronunciation} /`}</Text>}
            {pageData.translation && <Text style={styles.translationText}>{pageData.translation}</Text>}
            {pageData.translation && <Text style={styles.translationText}>{pageData.entranslation}</Text>}
          </View>
          <View style={styles.playBlock}>
            <TouchableOpacity onPress={() => this.onPlaySound(pageData)}>
              <Icon name="play-circle-filled" size={100} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
      </FlipCard>
    );
  }

  renderToolbar() {
    if (Platform.OS === 'ios') {
      return (
        <NavigationBar
          statusBar={{ style: 'light-content', tintColor: '#4CAF50' }}
          style={styles.navigatorBarIOS}
          title={{ title: this.props.title, tintColor: 'white' }}
          leftButton={
            <TouchableOpacity onPress={() => this.popAndAd()}>
              <Icon style={styles.navigatorLeftButton} name="close" size={26} color="white" />
            </TouchableOpacity>
          }
          rightButton={
            <TouchableOpacity onPress={() => this.shuffle()}>
              <Icon style={styles.navigatorRightButton} name="shuffle" size={26} color="white" />
            </TouchableOpacity>
          }
        />
      );
    } else if (Platform.OS === 'android') {
      return (
        <Icon.ToolbarAndroid
          navIconName="arrow-back"
          onIconClicked={this.popAndAd}
          style={styles.toolbar}
          title={this.props.title}
          titleColor="white"
          actions={[
            { title: 'Shuffle', iconName: 'shuffle', iconSize: 26, show: 'always' },
          ]}
          onActionSelected={position => this.onActionSelected(position)}
        />
      );
    }
  }

  render() {
    tracker.trackScreenView('card');
    return (
      <View style={styles.container}>
        {this.renderToolbar()}
        <IndicatorViewPager
          style={{ flex: 1 }}
          indicator={<PagerDotIndicator selectedDotStyle={styles.selectDot} pageCount={Math.min(this.state.vocabulary.length, 10)} />}
        >
          {this.state.vocabulary.map((object, i) => this.renderPage(object, i))}
          <View style={{ paddingTop: 100 }}><AdmobCell bannerSize="mediumRectangle" /></View>
        </IndicatorViewPager>
        <AdBanner />
      </View>
    );
  }
}

CardView.propTypes = {
  title: React.PropTypes.string,
  vocabulary: React.PropTypes.arrayOf(React.PropTypes.object),
};

CardView.defaultProps = {
  title: '',
  vocabulary: [],
};
