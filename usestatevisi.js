function App() {
    const [$$countValue, $$setCountValue] = useState(0);
    $$count += 1;
    return (<ThemeProvider>
        <DefaultButton color="primary" onClick={() => $$setCountValue(() => $$countValue + 1)}>
            Hello Pedro, you hit this button {$$countValue} time
        </DefaultButton>
    </ThemeProvider>);
}
export default App;