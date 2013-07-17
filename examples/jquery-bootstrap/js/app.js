/** @jsx React.DOM */

// Simple pure-React component so we don't have to remember
// Bootstrap's classes
var BootstrapButton = React.createClass({
  render: function() {
    // transferPropsTo() is smart enough to merge classes provided
    // to this component.
    return this.transferPropsTo(
      <a href="javascript:;" role="button" class="btn">
        {this.props.children}
      </a>
    );
  }
});

var BootstrapModal = React.createClass({
  // The following two methods are the only places we need to
  // integrate with Bootstrap or jQuery!
  componentDidMount: function() {
    // When the component is added, turn it into a modal
    $(this.getDOMNode()).modal({backdrop: 'static', keyboard: false});
  },
  componentWillUnmount: function() {
    // And when it's destroyed, hide it.
    $(this.getDOMNode()).modal('hide');
  },
  render: function() {
    var confirmButton = null;
    var cancelButton = null;

    if (this.props.confirm) {
      confirmButton = (
        <BootstrapButton
          onClick={this.onConfirm}
          class="btn-primary">
          {this.props.confirm}
        </BootstrapButton>
      );
    }
    if (this.props.cancel) {
      cancelButton = (
        <BootstrapButton onClick={this.onCancel}>
          {this.props.cancel}
        </BootstrapButton>
      );
    }

    return (
      <div class="modal hide fade">
        <div class="modal-header">
          <button
            type="button"
            class="close"
            onClick={this.onCancel}
            dangerouslyInsertInnerHtml={{__html: '&times;'}}
          />
          <h3>{this.props.title}</h3>
        </div>
        <div class="modal-body">
          {this.props.children}
        </div>
        <div class="modal-footer">
          {cancelButton}
          {confirmButton}
        </div>
      </div>
    );
  },
  onCancel: function() {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
    this.close();
  },
  onConfirm: function() {
    if (this.props.onConfirm) {
      this.props.onConfirm();
    }
    this.close();
  },
  close: function() {
    if (this.props.onClose) {
      this.props.onClose();
    }
  }
});

var Example = React.createClass({
  getInitialState: function() {
    return {modalVisible: false};
  },
  toggleModal: function() {
    this.setState({modalVisible: !this.state.modalVisible});
  },
  handleCancel: function() {
    if (confirm('Are you sure you want to cancel?')) {
      this.toggleModal();
    }
  },
  render: function() {
    var modal = null;
    if (this.state.modalVisible) {
      modal = (
        <BootstrapModal
          confirm="OK"
          cancel="Cancel"
          onCancel={this.handleCancel}
          onConfirm={this.toggleModal}
          title="Hello, Bootstrap!">
            This is a React component powered by jQuery and Bootstrap!
        </BootstrapModal>
      );
    }
    return (
      <div class="example">
        {modal}
        <BootstrapButton onClick={this.toggleModal}>Toggle modal</BootstrapButton>
      </div>
    );
  }
});

React.renderComponent(<Example />, document.getElementById('jqueryexample'));
