import React, { Component } from 'react'
import { Grid, Row, Col, Checkbox } from 'react-bootstrap'
import ipc from 'lib/ipc';

let state = {
    logAPIs: false,
    syncPort: false
};

export const settingsClass = class APILogSettings extends Component {
    constructor(props) {
        super(props)
        this.state = state;
        this.chain = Promise.resolve();
        if (window.cloudChinjufu) {
            this.loadConfig();
        }
        ipc.on('update', o => {
            if (o.type === '@@registerIPC' && o.value.scope === 'cloud-chinjufu') {
                this.loadConfig();
            }
        });
    }
    loadConfig = () => {
        if (!window.cloudChinjufu.ready) {
            window.cloudChinjufu.once('ready', () => this.loadConfig());
            return;
        }
        this.chain = this.chain.then(() => window.cloudChinjufu.getItem('api-log-config'))
            .then(s => {
                if (state !== null) {
                    state = s;
                    this.setState(state);
                }
            })
            .catch(err => window.error(err));
    }
    toggleLogAPIs = () => {
        state.logAPIs = !state.logAPIs;
        this.setState(state);
        this.chain = this.chain
            .then(() => window.cloudChinjufu.setItem('api-log-config', state))
            .catch(err => window.error(err));
    }
    toggleSyncPort = () => {
        state.syncPort = !state.syncPort;
        this.setState(state);
        this.chain = this.chain
            .then(() => window.cloudChinjufu.setItem('api-log-config', state))
            .catch(err => window.error(err));
    }
    render() {
        return (
            <Grid>
                <Row>
                    <Col xs={12}>
                    <Checkbox checked={this.state.logAPIs} onChange={this.toggleLogAPIs}>记录请求日志</Checkbox>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <Checkbox checked={this.state.syncPort} onChange={this.toggleSyncPort}>记录母港状态</Checkbox>
                    </Col>
                </Row>
            </Grid>
        )
    }
}

function handleResponse(e) {
    if (e.detail.path === '/kcsapi/api_start2') return;
    if (window.cloudChinjufu && window.cloudChinjufu.ready) {
        if (state.syncPort && e.detail.path === '/kcsapi/api_port/port') {
            window.cloudChinjufu.setItem('api.port', e.detail.body);
        } 
        if (state.logAPIs) {
            window.cloudChinjufu.publish('api', e.detail);
        }
    }
}

export const pluginDidLoad = () => {
    window.addEventListener('game.response', handleResponse);
}

export const pluginWillUnload = () => {
    window.removeEventListener('game.response', handleResponse);
}


