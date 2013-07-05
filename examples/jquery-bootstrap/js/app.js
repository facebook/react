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
    $(this.getDOMNode())
      .modal({
        backdrop: 'static',
        keyboard: false,
        show: this.props.initiallyVisible
      })
      .on('hidden', this.handleHidden);
  },
  componentWillUnmount: function() {
    $(this.getDOMNode()).off('hidden', this.handleHidden);
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
  close: function() {
    $(this.getDOMNode()).modal('toggle');
  },
  onCancel: React.autoBind(function() {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }),
  onConfirm: React.autoBind(function() {
    if (this.props.onConfirm) {
      this.props.onConfirm();
    }
  }),
  handleHidden: React.autoBind(function() {
    if (this.props.onHidden) {
      this.props.onHidden();
    }
  })
});

var Example = React.createClass({
  toggleModal: React.autoBind(function() {
    this.refs.modal.close();
  }),
  handleCancel: React.autoBind(function() {
    if (confirm('Are you sure you want to cancel?')) {
      this.toggleModal();
    }
  }),
  handleHidden: function() {
    console.log('Modal closed.');
  },
  render: function() {
    var modal = null;
    modal = (
      <BootstrapModal
        confirm="OK"
        cancel="Cancel"
        onCancel={this.handleCancel}
        onConfirm={this.toggleModal}
        title="Hello, Bootstrap!"
        initiallyVisible={false}
        onHidden={this.handleHidden}
        ref="modal">
          This is a React component powered by jQuery and Bootstrap!
      </BootstrapModal>
    );
    return (
      <div class="example">
        {modal}
        <BootstrapButton onClick={this.toggleModal}>Toggle modal</BootstrapButton>
      </div>
    );
  }
});

React.renderComponent(<Example />, document.getElementById('jqueryexample'));
