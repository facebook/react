const Component = () => {
    const [reviewData, setReviewData] = React.useState(undefined);
    
    React.useEffect(() => {
      fetch('https://swapi.dev/api/planets/1/')
      .then(res => res.json())
      .then(data => setReviewData(data))
    }, [])
  
    if (!reviewData) {
      return <div> no data </div>
    }
    return <div> {reviewData.name} </div>
  }
  
  ReactDOM.render(<Component />, document.getElementById('app'));
  <script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
  
  <div id="app"></div>