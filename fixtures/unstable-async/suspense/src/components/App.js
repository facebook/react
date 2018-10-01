import React, {Placeholder, PureComponent} from 'react';
import {unstable_scheduleCallback} from 'scheduler';
import {
  unstable_trace as trace,
  unstable_wrap as wrap,
} from 'scheduler/tracing';
import {createResource} from 'react-cache';
import {cache} from '../cache';
import Spinner from './Spinner';
import ContributorListPage from './ContributorListPage';

const UserPageResource = createResource(() => import('./UserPage'));

function UserPageLoader(props) {
  const UserPage = UserPageResource.read(cache).default;
  return <UserPage {...props} />;
}

export default class App extends PureComponent {
  state = {
    currentId: null,
    showDetail: false,
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.showDetail !== this.state.showDetail ||
      (prevState.currentId !== this.state.currentId && this.state.showDetail)
    ) {
      window.scrollTo(0, 0);
    }
  }

  handleUserClick = id => {
    trace(`View ${id}`, performance.now(), () => {
      trace(`View ${id} (high-pri)`, performance.now(), () =>
        this.setState({
          currentId: id,
        })
      );
      unstable_scheduleCallback(
        wrap(() =>
          trace(`View ${id} (low-pri)`, performance.now(), () =>
            this.setState({
              showDetail: true,
            })
          )
        )
      );
    });
  };

  handleBackClick = () =>
    trace('View list', performance.now(), () =>
      this.setState({
        currentId: null,
        showDetail: false,
      })
    );

  render() {
    const {currentId, showDetail} = this.state;
    return showDetail
      ? this.renderDetail(currentId)
      : this.renderList(currentId);
  }

  renderDetail(id) {
    return (
      <div>
        <button
          onClick={this.handleBackClick}
          style={{
            display: 'block',
            marginBottom: '1rem',
          }}>
          Return to list
        </button>
        <Placeholder delayMs={2000} fallback={<Spinner size="large" />}>
          <UserPageLoader id={id} />
        </Placeholder>
      </div>
    );
  }

  renderList(loadingId) {
    return (
      <Placeholder delayMs={1500} fallback={<Spinner size="large" />}>
        <ContributorListPage
          loadingId={loadingId}
          onUserClick={this.handleUserClick}
        />
      </Placeholder>
    );
  }
}
