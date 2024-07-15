import React, { Component } from 'react';
import PropTypes from 'prop-types'
import PrivateMessaging from '../PrivateMessaging';
import axios from 'axios';
import io from 'socket.io-client';
var forge = require('node-forge');

const SOCKET_URL = "http://localhost:3000";
const socket = io(SOCKET_URL);
const API_URL = 'http://localhost:3000/api';

export default class PrivateMessagingContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      privateMessageInput: "",
      privateMessageLog: [],
      conversationId: "",
      socketPMs: [],
      currentPrivateRecipient: this.props.currentPrivateRecipient,
      showTyping: false,
      activeUserTyping: ""
    }
  }

  handlePrivateInput = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handlePrivateSubmit = (e) => {
    e.preventDefault();

    this.sendPrivateMessage();
  }
  sendPrivateMessage = () => {
    const privateMessageInput = this.state.privateMessageInput;
    const recipientId = this.props.currentPrivateRecipient._id;
    const recipientUsername = this.props.currentPrivateRecipient.username;
    const myKey = forge.pki.publicKeyFromPem(localStorage.getItem('pubKey'));
    const recipientKey = forge.pki.publicKeyFromPem(localStorage.getItem('pub-' + recipientUsername));
    const encryptedAuthorMessage = myKey.encrypt(privateMessageInput);
    const encryptedRecipientMessage = recipientKey.encrypt(privateMessageInput);
    axios.post(`${API_URL}/chat/reply`, { encryptedRecipientMessage, encryptedAuthorMessage, privateMessageInput, recipientId }, {
      headers: { Authorization: this.props.token }
    })
    .then(res => {
      const socketMsg = {
        encryptedRecipientMessage: res.data.reply.encryptedRecipientMessage,
        encryptedAuthorMessage: res.data.reply.encryptedAuthorMessage,
        conversationId: res.data.reply.conversationId,
        author:[{
          item:{
            username: this.props.username
          }
        }]
      }
      socket.emit('new privateMessage', socketMsg);

      this.setState({
        privateMessageInput: ""
      })
    })
    .catch(err => {
      console.log(err);
    })
  }

  getPrivateMessages = () => {
    const currentPrivateRecipient = this.props.currentPrivateRecipient;

    axios.get(`${API_URL}/chat/privatemessages/${currentPrivateRecipient._id}`, {
      headers: { Authorization: this.props.token }
    })
    .then(res => {
      socket.emit('enter privateMessage', res.data.conversationId)
      this.setState({
        privateMessageLog: res.data.conversation || [],
        conversationId: res.data.conversationId
      })
    })
    .catch(err => {
      console.log(err)
    })
  }

  userTyping = (isTyping) => {
    const conversationId = this.state.conversationId;
    const username = this.props.username;
    const data = {
      isTyping,
      conversationId,
      username
    }
    socket.emit('user typing', data)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentPrivateRecipient: nextProps.currentPrivateRecipient
    }, () => {
      this.getPrivateMessages()
    })
  }
  componentDidMount() {
    this.getPrivateMessages();

    socket.on('refresh privateMessages', (data) => {
      const updatedSocketPMs = Array.from(this.state.socketPMs);

      updatedSocketPMs.push(data);

      this.setState({
        socketPMs: updatedSocketPMs
      })
    });

    socket.on('typing', (data) => {

      this.setState({
        showTyping: data.isTyping,
        activeUserTyping: data.username
      });
    })

  }
  componentWillUnmount() {
    socket.emit('leave privateMessage', this.state.conversationId);
    socket.off('refresh privateMessages');
    socket.off('typing'); 
  }

  render() {
    const { closePM } = this.props;
    return (
      <div className="private__message--container" onClick={(e) => {closePM(e)}}>
        <PrivateMessaging
          handlePrivateInput={this.handlePrivateInput} 
          handlePrivateSubmit={this.handlePrivateSubmit}
          userTyping={this.userTyping}
          {...this.props}
          {...this.state}
        />
      </div>
    )
  }
}

PrivateMessagingContainer.propTypes = {
  privateMessageInput: PropTypes.string,
  privateMessageLog: PropTypes.array,
  conversationId: PropTypes.string,
  socketPMs: PropTypes.array,
  currentPrivateRecipient: PropTypes.object,
  showTyping: PropTypes.bool,
  activeUserTyping: PropTypes.string
}
