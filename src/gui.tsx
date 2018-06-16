import * as React from "react";
import * as ReactDOM from "react-dom";
import PropTypes from "prop-types";

declare const __DEV__: boolean;

class TestComponent extends React.PureComponent<any, any> {
    constructor(props: any) {
        super(props);

        this.state = {
            ticks: 0,
        };

        setInterval(() => {
            this.setState({
                ticks: this.state.ticks + 1
            });
        }, 1000);
    }

    render() {
        return (
            <div>
                <p>Node version: {process.versions.node}</p>
                <p>Chromium version: {process.versions["chrome"]}</p>
                <p>Tick: {this.state.ticks}</p>
            </div>
        );
    }
}

// test plugin
class MyComponent extends React.Component<any> {
    static propTypes = {
        className: PropTypes.string.isRequired
    };

    render() {
        return (
            <div className={this.props.className}>
                <span>Hello World</span>
            </div>
        );
    }
}

const host = document.getElementById("app");
ReactDOM.render(
    <div>
        <TestComponent/>
        <MyComponent className="MyClass"/>
    </div>,
    host);

if(__DEV__) {
    (window as any)["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true;
}

/**
 * run this in the (devtools) console to get access to  the react tools
 * require('electron-react-devtools').install()
 */