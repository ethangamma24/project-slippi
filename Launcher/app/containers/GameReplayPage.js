import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import GameReplay from '../components/replay/GameReplay';
import * as ReplayActions from "../actions/replay";

const _ = require('lodash');

function mapStateToProps(state) {
  return {
    store: state.replay,
    errors: state.errors,
  };
}

function mapDispatchToProps(dispatch) {
  const allActions = _.extend({}, ReplayActions);
  return bindActionCreators(allActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(GameReplay);
