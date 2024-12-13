import globalStyles from "./global.css?url";

export function Document({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link rel="stylesheet" href={globalStyles} />
			</head>
			<body>
				<nav>
					<ul>
						<li>
							<a href="/">Home</a>
						</li>
						<li>
							<a href="/about">About</a>
						</li>
					</ul>
				</nav>
				{children}
			</body>
		</html>
	);
}
