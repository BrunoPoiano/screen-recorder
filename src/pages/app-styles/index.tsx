import styles from "./styles.module.css";

export const AppStyles = () => {
	return (
		<div className={styles.AppStylesWrapper}>
			<Typography />
			<Colors />
		</div>
	);
};

const Typography = () => {
	return (
		<div>
			<h1>Electron React App</h1>
			<h2>Electron React App</h2>
			<h3>Electron React App</h3>
			<h4>Electron React App</h4>
			<h5>Electron React App</h5>
			<p>Electron React App</p>
			<small>Electron React App</small>
		</div>
	);
};

const Colors = () => {
	const HandleColors = () => {
		const total = 100;

		const colors = [];

		for (let i = 10; i < total; i = i + 5) {
			colors.push(`--neutral-color-${i}`);
		}

		return colors;
	};

	return (
		<div className={styles.ColorWrapper}>
			{HandleColors().map((item: string) => (
				<div style={{ backgroundColor: `var(${item})` }}></div>
			))}
		</div>
	);
};
