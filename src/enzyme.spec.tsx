import Enzyme, { shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

// React 16 Enzyme adapter
Enzyme.configure({ adapter: new Adapter() });


describe("GUI with Enzyme", () => {
    test("render a label", () => {
        const wrapper = shallow(
            <label>Hello Jest!</label>
        );
        expect(wrapper).toMatchSnapshot();
    });
});