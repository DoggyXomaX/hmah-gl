const Template = 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx';
const TemplateLength = Template.length;

// https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random)
export const v4 = () => {
  const output = new Array<string>(TemplateLength);
  for (let i = 0; i < TemplateLength; i++) {
    const c = Template[i];
    switch (c) {
      case 'x':
        output[i] = (Math.random() * 16 | 0).toString(16);
        break;
      case 'M':
        output[i] = '4';
        break;
      case 'N':
        output[i] = (Math.random() * 4 | 8).toString(16);
        break;
      default:
        output[i] = c;
        break;
    }
  }
  return output.join('');
};