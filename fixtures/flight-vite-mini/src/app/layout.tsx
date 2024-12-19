export function Layout(props: React.PropsWithChildren) {
	return (
		<html>
			<head>
				<meta charSet="UTF-8" />
				<title>react-server</title>
				<meta
					name="viewport"
					content="width=device-width, height=device-height, initial-scale=1.0"
				/>
			</head>
			<body>
				<ul>
					<li>
						<a href="/">Home</a>
					</li>
					<li>
						<a href="/other">Other</a>
					</li>
				</ul>
				{props.children}
			</body>
		</html>
	);
}
