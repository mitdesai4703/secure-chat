import React, { Component } from 'react';
import Moment from 'moment';
import axios from "axios";
var forge = require('node-forge');

const API_URL = 'http://localhost:3000/api';

export default class PrivateMessaging extends Component{
  constructor() {
    super();
    this.state = {
      isTyping: false,
    }
  }

  scrollDown = () => {
    const { chat_container } = this.refs;
    chat_container.scrollTop = chat_container.scrollHeight;
  }

  getPublicKey = (username) => {
    if (localStorage.getItem('pub-' + username)) {
      return localStorage.getItem('pub-' + username);
    }
    axios.get(`${API_URL}/auth/certif/`+ username, {
      headers: { Authorization: this.state.token }
    })
        .then(res => {
          const pem = res.data.certificate;
          const certif = forge.pki.certificateFromPem(pem);
          const publicKey = certif.publicKey;
          const pubKeyPem = forge.pki.publicKeyToPem(publicKey);
          localStorage.setItem('pub-' + username, pubKeyPem);
          return pubKeyPem;
        })
        .catch(err => {
          console.log(err);
        });
  }
  sendTyping = () => {
    this.lastUpdateTime = Date.now();
    if (!this.state.isTyping) {
      this.setState({
        isTyping: true
      })
      this.props.userTyping(true)
      this.startCheckTyping();
    }
  }

  startCheckTyping = () => {
    this.typingInterval = setInterval(() => {
      if((Date.now() - this.lastUpdateTime) > 300) {
        this.setState({
          isTyping: false
        });
        this.stopCheckTyping();
      }
    }, 300)
  }

  stopCheckTyping = () => {
    if (this.typingInterval) {
      clearInterval(this.typingInterval)
      this.props.userTyping(false);
    }
  }

  componentDidMount() {
    this.scrollDown();
    const {currentPrivateRecipient} = this.props;
    this.getPublicKey(currentPrivateRecipient.username);
  }

  componentDidUpdate(prevProps, prevState) {
    this.scrollDown();  
  }

  componentWillUnmount() {
    this.stopCheckTyping();
  }

  decrypt(message) {
    const myKey = forge.pki.privateKeyFromPem(localStorage.getItem('priKey'));
    return myKey.decrypt(message);
  }

  render() {
    const { handlePrivateInput, handlePrivateSubmit, closePM, currentPrivateRecipient, privateMessageLog, socketPMs, privateMessageInput, showTyping, activeUserTyping, username } = this.props;

    return (
      <div className="private__message--window"  onClick={((e) =>{e.stopPropagation()})}>
        <div className="chatapp__chatbox" id="private__message--input">
          <button onClick={(e) => {closePM(e)}}>&#xf00d;</button>
          <p>Conversation with {currentPrivateRecipient.username}</p>
          <div className="chatapp__chatbox--messages" id="private__chatbox" ref="chat_container">
          {
            (privateMessageLog.length)
              ? <ul>
                    {privateMessageLog.map((message, index) => {
                      return (
                        <li className={(username !== message.author[0].item.username) ? "chat--received" : null} key={`chatMsgId-${index}`}>
                          <div className="speech--bubble--author">
                            {
                              (username === message.author[0].item.username)
                                ? <p>You</p>
                                : <p>{message.author[0].item.username}</p>
                            }
                            <p className="speech--bubble--date">{Moment(message.createdAt).fromNow()}</p>
                          </div>
                          <div className="speech--bubble">
                            {/*<p>{message.body}</p>*/}
                            <p>{(username === message.author[0].item.username) ? this.decrypt(message.encryptedAuthorMessage): this.decrypt(message.encryptedRecipientMessage)}</p>
                          </div>
                        </li>
                      )
                    })}
                </ul>
              : null
          }
          {
            (socketPMs.length)
              ? <ul>
                  {socketPMs.map((message, index) => {
                    return (
                      <li className={(username !== message.author[0].item.username) ? "chat--received": null} key={`socketPMsId-${index}`}>
                        <div className="speech--bubble--author">
                          {
                            (username === message.author[0].item.username)
                              ? <p>You</p>
                              : <p>{message.author[0].item.username}</p>
                          }
                          <p className="speech--bubble--date">{Moment(message.createdAt).fromNow()}</p>
                        </div>
                        <div className="speech--bubble">
                          {/*<p>{message.body}</p>*/}
                          <p>{(username === message.author[0].item.username) ? this.decrypt(message.encryptedAuthorMessage): this.decrypt(message.encryptedRecipientMessage)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              : null
          }
          {
            (activeUserTyping !== this.props.username)
              ? <div className="active__typing">
                  {
                    (showTyping)
                      ? <p>
                        {`${activeUserTyping} is typing...`}
                        </p>
                      : null
                  }
                </div>
              : null
          }
          </div>
          <form onSubmit={handlePrivateSubmit}>
            <input 
            onChange={handlePrivateInput} 
            value={privateMessageInput} 
            name="privateMessageInput" 
            type="text" 
            placeholder="Write a message" 
            autoComplete="off"
            onKeyUp= { e => { e.keyCode !== 13 && this.sendTyping()} }
            />
          </form>
        </div>
      </div>
    )
  } 
}
