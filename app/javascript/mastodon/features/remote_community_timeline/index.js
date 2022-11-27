import React from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import StatusListContainer from '../ui/containers/status_list_container';
import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import { expandRemoteCommunityTimeline } from '../../actions/timelines';
import { addColumn, removeColumn, moveColumn } from '../../actions/columns';
import ColumnSettingsContainer from './containers/column_settings_container';
import { connectRemoteCommunityStream } from '../../actions/streaming';
import { Helmet } from 'react-helmet';
import { domain } from 'mastodon/initial_state';
import DismissableBanner from 'mastodon/components/dismissable_banner';

const messages = defineMessages({
  title: { id: 'column.remote_community', defaultMessage: 'Remote timeline' },
});

const mapStateToProps = (state, { columnId }) => {
  const uuid = columnId;
  const columns = state.getIn(['settings', 'columns']);
  const index = columns.findIndex(c => c.get('uuid') === uuid);
  const onlyMedia = (columnId && index >= 0) ? columns.get(index).getIn(['params', 'other', 'onlyMedia']) : state.getIn(['settings', 'remote_community', 'other', 'onlyMedia']);
  const timelineState = state.getIn(['timelines', `remote_community${onlyMedia ? ':media' : ''}`]);

  return {
    hasUnread: !!timelineState && timelineState.get('unread') > 0,
    onlyMedia,
  };
};

export default @connect(mapStateToProps)
@injectIntl
class RemoteCommunityTimeline extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
    identity: PropTypes.object,
  };

  static defaultProps = {
    onlyMedia: false,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    columnId: PropTypes.string,
    intl: PropTypes.object.isRequired,
    hasUnread: PropTypes.bool,
    multiColumn: PropTypes.bool,
    onlyMedia: PropTypes.bool,
  };

  remoteDomain = this.props.params.domain;

  handlePin = () => {
    const { columnId, dispatch, onlyMedia } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('REMOTE_COMMUNITY', { other: { onlyMedia } }));
    }
  }

  handleMove = (dir) => {
    const { columnId, dispatch } = this.props;
    dispatch(moveColumn(columnId, dir));
  }

  handleHeaderClick = () => {
    this.column.scrollTop();
  }

  componentDidMount () {
    const { dispatch, onlyMedia } = this.props;
    const { signedIn } = this.context.identity;

    dispatch(expandRemoteCommunityTimeline(this.remoteDomain, { onlyMedia }));

    if (signedIn) {
      this.disconnect = dispatch(connectRemoteCommunityStream(this.remoteDomain, { onlyMedia }));
    }
  }

  componentDidUpdate (prevProps) {
    const { signedIn } = this.context.identity;

    if (prevProps.domain !== this.remoteDomain || prevProps.onlyMedia !== this.props.onlyMedia) {
      const { dispatch, onlyMedia } = this.props;

      if (this.disconnect) {
        this.disconnect();
      }

      dispatch(expandRemoteCommunityTimeline(this.remoteDomain, { onlyMedia }));

      if (signedIn) {
        this.disconnect = dispatch(connectRemoteCommunityStream(this.remoteDomain, { onlyMedia }));
      }
    }
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  setRef = c => {
    this.column = c;
  }

  handleLoadMore = maxId => {
    const { dispatch, onlyMedia } = this.props;

    dispatch(expandRemoteCommunityTimeline(this.remoteDomain, { maxId, onlyMedia }));
  }

  render () {
    const { intl, hasUnread, columnId, multiColumn, onlyMedia } = this.props;
    const pinned = !!columnId;

    return (
      <Column bindToDocument={!multiColumn} ref={this.setRef} label={intl.formatMessage(messages.title) + " - " + this.remoteDomain}>
        <ColumnHeader
          icon='users'
          active={hasUnread}
          title={intl.formatMessage(messages.title) + " - " + this.remoteDomain}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
        >
          <ColumnSettingsContainer columnId={columnId} />
        </ColumnHeader>

        <DismissableBanner id='remote_community_timeline'>
          <FormattedMessage id='dismissable_banner.remote_community_timeline' defaultMessage='These are the most recent public posts from people whose accounts are hosted by {domain}.' values={{ domain }} />
        </DismissableBanner>

        <StatusListContainer
          trackScroll={!pinned}
          scrollKey={`remote_community_timeline-${columnId}`}
          timelineId={`remote_community${onlyMedia ? ':media' : ''}`}
          onLoadMore={this.handleLoadMore}
          emptyMessage={<FormattedMessage id='empty_column.remote_community' defaultMessage='The local timeline is empty. Write something publicly to get the ball rolling!' />}
          bindToDocument={!multiColumn}
        />

        <Helmet>
          <title>{intl.formatMessage(messages.title) + " - " + this.remoteDomain}</title>
          <meta name='robots' content='noindex' />
        </Helmet>
      </Column>
    );
  }

}
