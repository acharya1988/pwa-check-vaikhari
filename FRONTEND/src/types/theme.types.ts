

export interface StyleProperty {
  fontSize?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  backgroundColor?: string;
  borderColor?: string;
  border?: string;
  padding?: string;
}

export interface ThemeStyles {
  body: StyleProperty;
  h1: StyleProperty;
  h2: StyleProperty;
  h3: StyleProperty;
  h4: StyleProperty;
  h5: StyleProperty;
  h6: StyleProperty;
  paragraph: StyleProperty;
  sutra: StyleProperty;
  bhashya: StyleProperty;
  teeka: StyleProperty;
  citation: StyleProperty;
  quotation: StyleProperty;
  version: StyleProperty;
  footnote: StyleProperty;
  note: StyleProperty;
}

export interface BookTheme {
  bookId: string;
  themeName: string;
  isDefault?: boolean;
  styles: ThemeStyles;
}
