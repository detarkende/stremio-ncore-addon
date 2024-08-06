import type { FC, PropsWithChildren } from 'hono/jsx';

export const Layout: FC<PropsWithChildren<{ title?: string }>> = (props) => {
	const { title = 'Stremio nCore addon' } = props;
	return (
		<html style={{ height: '100%' }}>
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css"></link>
				<script src="https://unpkg.com/htmx.org@1.9.10"></script>
				<title>{title}</title>
			</head>
			<body style={{ height: '100%' }}>{props.children}</body>
		</html>
	);
};
