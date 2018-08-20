import Markdown from '../components/markdown';
import '../../components/form/style';
import '../../components/date-picker/style';
import '../../components/dropdown/style';
import '../../components/time-picker/style';
import '../../components/icon/style';

export default class TimePicker extends Markdown {
  // eslint-disable-next-line
  document () {
    return require('../docs/timepicker.md');
  }
}
