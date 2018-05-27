import * as React from "react";
import * as ReactDOM from "react-dom";

declare const __DEV__: boolean;

class TestComponent extends React.PureComponent<any, any> {
    constructor(props: any) {
        super(props);

        this.state = {
            ticks: 0
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
                Node version: {process.versions.node}
                Tick: {this.state.ticks}
            </div>
        );
    }
}

const host = document.getElementById("app");
ReactDOM.render(
    <TestComponent></TestComponent>,
    host);

if(__DEV__) {
    (window as any)["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true;
}

/**
 * run this in the (devtools) console to get access to  the react tools
 * require('electron-react-devtools').install()
 */