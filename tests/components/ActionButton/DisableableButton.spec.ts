describe('DisabledState', () => {
    describe('constructor', () => {
        it('should use the icon and tooltip from the option of the disabledButton');
        it('should set click to an empty arrow-function');
    });

    describe('onStateEntry', () => {
        it('should add coveo-actionbutton-disabled to the classlist on this.element of the caller');
        it('should add the attribute disabled to this.element of the caller');
    });

    describe('onStateExit', () => {
        it('should remove coveo-actionbutton-disabled to the classlist on this.element of the caller');
        it('should remove the attribute disabled to this.element of the caller');
    });
});
