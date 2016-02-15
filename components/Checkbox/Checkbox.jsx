
import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

class Checkbox extends Component {

  constructor(props) {
    super(props);
    this.state = {
      checked: props.checked || props.defaultChecked,
    };
  }

  componentWillReceiveProps(nextProps) {
    if ('checked' in nextProps) {
      this.setState({
        checked: !!nextProps.checked
      });
    }
  }

  render () {
    const props = this.props;
    const { value, isDisabled, className, children, ...others } = props;
    const disabled = 'disabled' in props || isDisabled;

    const cls = classnames({
      'ui-checkbox'         : true,
      'ui-checkbox-checked' : this.state.checked,
      'ui-checkbox-disabled': disabled,
    });

    const inputDisabled = disabled
                        ? 'disabled'
                        : null;

    return (
      <label className="ui-checkbox">
        <span className={cls}>
          <input type="checkbox" value={value} className="ui-checkbox-input" onChange={(e) => this._onClick(e)} disabled={inputDisabled} {...others} />
          <span className="ui-checkbox-inner"></span>
        </span>
        {children}
      </label>
    );
  }

  _onClick(e) {
    this.setState({
      checked: true
    });
    this.props.onChange(e);
  }
}

Checkbox.propTypes = {
  defaultChecked: PropTypes.bool,
  isDisabled    : PropTypes.bool,
  onChange      : PropTypes.func,
};

Checkbox.defaultProps = {
  defaultChecked: false,
  isDisabled    : false,
  onChange      : function () {},
};

export default Checkbox;