import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Option from './Option';
import Menu from '../Menu';

class SelectMultiple extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value:
        props.value ||
        props.defaultValue ||
        this.getCheckedValue(props.children)
    };
  }

  componentWillReceiveProps(nextProps) {
    if ('value' in nextProps || this.getCheckedValue(nextProps.children)) {
      this.setState({
        value: nextProps.value || this.getCheckedValue(nextProps.children)
      });
    }
  }

  render() {
    const { props } = this;
    const {
      isRadius, isDisabled, size, style
    } = props;
    const disabled = 'disabled' in props || isDisabled;
    const radius = 'radius' in props || isRadius;

    // eslint-disable-next-line
    let children = React.Children.map(props.children, (option, index) => {
      return (
        <Option
          {...option.props}
          onChange={e => this.onOptionChange(e, option.props, index)}
          checked={!!(this.state.value.indexOf(option.props.value) > -1)}
        />
      );
    });

    const cls = classnames({
      'ui-select': true,
      'ui-select-open': this.state.dropdown,
      disabled,
      radius,
      [`size-${size}`]: !!size
    });

    return (
      <span className={cls} style={style}>
        <span
          className="ui-select-selection"
          style={{ height: '100%' }}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={e => !disabled && this.onSelectClick(e)}
        >
          <Menu size={size}>{children}</Menu>
        </span>
      </span>
    );
  }

  // eslint-disable-next-line
  getCheckedValue(children) {
    let checkedValue = [];
    React.Children.forEach(children, (option) => {
      if (option.props && option.props.checked) {
        checkedValue.push(option.props.value);
      }
    });
    return checkedValue;
  }

  // eslint-disable-next-line
  onSelectClick(e) {
    e.preventDefault();
  }

  onOptionChange(e, props, rowIndex) {
    if ('disabled' in props) {
      return;
    }

    let { value } = this.state;
    let index = value.indexOf(props.value);
    let isSelected = index > -1;

    if (isSelected) {
      value.splice(index, 1);
    } else {
      value.push(props.value);
    }

    const row = {
      index: rowIndex,
      value: props.value,
      text: props.children,
      selected: !isSelected
    };

    this.setState({ value }, this.props.onChange(value, row));
  }
}

SelectMultiple.propTypes = {
  isRadius: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onChange: PropTypes.func
};

SelectMultiple.defaultProps = {
  isRadius: false,
  isDisabled: false,
  onChange: () => {}
};

export default SelectMultiple;
