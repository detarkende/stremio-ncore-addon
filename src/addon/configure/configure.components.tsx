import type { FC } from 'hono/jsx';

type MessageType = 'error' | 'success';
type ElementWithMessageProps<TExtraProps = object> = TExtraProps &
	(
		| { message: string; messageType: MessageType }
		| { message?: undefined; messageType?: undefined }
	);

export const ElementWithMessage: FC<ElementWithMessageProps> = ({
	message,
	messageType,
	children,
}) => {
	const colorMap: Record<MessageType, string> = {
		error: 'red',
		success: 'green',
	};
	return (
		<div id="submit" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			{children}
			{message && (
				<div>
					<span style={{ color: colorMap[messageType] }}>{message}</span>
				</div>
			)}
		</div>
	);
};

export const LoginButton: FC<ElementWithMessageProps> = (props) => (
	<ElementWithMessage {...props}>
		<button type="submit">Log in</button>
	</ElementWithMessage>
);

export const Button: FC<ElementWithMessageProps<{ href: string }>> = ({
	href,
	children,
	...restProps
}) => {
	return (
		<ElementWithMessage {...restProps}>
			<a
				style={{
					display: 'inline-block',
					padding: '0.5rem',
					backgroundColor: 'var(--accent-hover)',
					borderColor: 'var(--accent-hover)',
					color: 'var(--accent-text)',
					borderRadius: 'var(--standard-border-radius)',
					textDecoration: 'none',
				}}
				href={href}
			>
				{children}
			</a>
		</ElementWithMessage>
	);
};

export const LoginForm: FC = () => (
	<form
		hx-post="/configure"
		hx-target="#submit"
		hx-swap="outerHTML"
		style={{
			padding: 'clamp(1rem, 5vw, 5rem)',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
		}}
	>
		<h1>Login</h1>
		<div>
			<label for="username">Username:</label>
			<input type="text" name="username" id="username" />
		</div>
		<div>
			<label for="password">Password:</label>
			<input type="password" name="password" id="password" />
		</div>
		<LoginButton />
	</form>
);
