import React, { Component } from 'react';
import { Container, Modal, Form, Card, Button } from 'semantic-ui-react';
import PageHeader from './common/PageHeader';

const _ = require('lodash');

export default class Console extends Component {
  props: {
    editConnection: () => void,
    cancelEditConnection: () => void,
    saveConnection: () => void,
    deleteConnection: () => void,
    connectConnection: () => void,
    history: object,
    store: object,
  };

  state = {
    formData: {},
  }

  addConnectionClick = () => {
    this.props.editConnection("new");
  };

  editConnectionClick = (index) => {
    this.props.editConnection(index);
  }

  onModalClose = () => {
    this.props.cancelEditConnection();
  };

  onFieldChange = (e, { name, value }) => {
    const formData = this.state.formData || {};
    this.setState({
      formData: {
        ...formData,
        [name]: value,
      },
    });
  };
  
  onFormSubmit = (index) => {
    const formData = this.state.formData || {};
    this.props.saveConnection(index, formData);
  };

  connectTo = (connection) => {
    this.props.connectConnection(connection);
  };

  renderContent() {
    const store = this.props.store || {};
    const connections = store.connections || [];

    return (
      <Container text={true}>
        <Button color="blue" onClick={this.addConnectionClick}>
          Add Connection
        </Button>
        {connections.map(this.renderConnection)}
      </Container>
    );
  }

  renderConnection = (connection, index) => {
    return (
      <Card key={`${connection.ipAddress}-connection`}>
        <Card.Content>
          <p>{connection.ipAddress}</p>
          <p>{connection.targetFolder}</p>
          <Button onClick={_.partial(this.editConnectionClick, index)}>
            Edit
          </Button>
          {this.renderConnectButton(connection)}
        </Card.Content>
      </Card>
    );
  }

  renderConnectButton = (connection) => {
    return (
      <Button onClick={_.partial(this.connectTo, connection)}>Connect</Button>
    );
  }

  renderEditModal() {
    const store = this.props.store || {};
    const connectionToEdit = store.connectionToEdit;

    const connectionIndex = _.get(connectionToEdit, 'index');
    const actionText = connectionIndex === "new" ? "Add" : "Edit";

    return (
      <Modal open={!!connectionToEdit} onClose={this.onModalClose}>
        <Modal.Header>{`${actionText} Connection`}</Modal.Header>
        <Modal.Content>
          {this.renderEditForm(connectionToEdit)}
        </Modal.Content>
      </Modal>
    );
  }

  renderEditForm(connection) {
    if (!connection) {
      return null;
    }

    return (
      <Form onSubmit={_.partial(this.onFormSubmit, connection.index)}>
        <Form.Input name="ipAddress" label="IP Address" value={connection.ipAddress} onChange={this.onFieldChange} />
        <Form.Input name="targetFolder" label="Target Folder" value={connection.targetFolder} onChange={this.onFieldChange} />
        <Form.Button content="Submit" />
      </Form>
    );
  }

  render() {
    return (
      <div className="main-padding">
        <PageHeader icon="microchip" text="Console" history={this.props.history} />
        {this.renderContent()}
        {this.renderEditModal()}
      </div>
    );
  }
}
