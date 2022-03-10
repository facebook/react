// So here is my situation:

// I have a component class called 'MainPanel' that houses 'MyTabs' component (user can select between tabs) and 'TabsViews' component(user can see the view for each tab).

// Upon MainPanel mount, I want to add 2 tabs and 2 views.

// Only one tab and one view is added.

// I call my refrences like so:

export class MainPanel extends React.Component<any, any> {
    ref_mytabs: React.RefObject<MyTabs>;
    ref_mytabpanels: React.RefObject<TabsViews>;

    componentDidMount() {
    	var page = <div>Welcome page</div>
    
    	this.ref_mytabs.current.addTab("Welcome tab");
    	this.ref_mytabpanels.current.addPanel(page);
    
    	this.ref_mytabs.current.addTab("Hello tab")
    	this.ref_mytabpanels.current.addPanel();
    }

// Only 'Hello Tab' is created. I suspect the setState ('Hello Tab') is called in the middle of another setState ('Welcome Tab'), which as a result, 'Hello Tab' is overwriting 'Welcome Tab'.

// React only updates the state once and only creates one tab, and one view.

// How can I avoid this issue?

// Here is the code for 'addTab', a basic setState:

addTab(label: string) {
    this.setState({
        tabs: this.state.tabs.concat([{
            id: this.state.id_aggregate,
            label: label
        }]),
        id_aggregate: this.state.id_aggregate + 1,
        selectedTabId: this.state.id_aggregate
    }, () => {
        console.log("Added tab:", this.state.selectedTabId)
    });
}

// I can also see in the console that 'Added tab: 0' twice, instead of 'Added tab: 0' and 'Added tab: 1'.
