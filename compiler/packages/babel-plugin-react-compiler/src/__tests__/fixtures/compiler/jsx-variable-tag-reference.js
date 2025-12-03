// @compilationMode(infer)

const base = 'div';
const TestComponent = () => {
    const Comp = base;
    return <Comp />;
};

export default function Home() {
    return <TestComponent />
}
