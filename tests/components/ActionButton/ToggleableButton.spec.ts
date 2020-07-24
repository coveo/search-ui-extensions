describe('ToggleUnactivatedState', () => {
    describe('constructor', () => {
        it('should use the icon, tooltip from the option of the ToggleableButton');
    });
});

describe('ToggleUnactivatedState', () => {
    describe('constructor', () => {
        it('should use the icon, tooltip from the option of the ToggleableButton');
    });

    describe('onStateEntry', () => {
        it('should add coveo-toggleactionbutton-activated to the classlist on this.element of the caller');
        it('should set the attribute aria-pressed to true on this.element of the caller');
        describe('if the toggleableButton options include activate', () => {
            it('should call call it with the toggleableButton for context');
        });
    });

    describe('onStateExit', () => {
        it('should remove coveo-actionbutton-disabled to the classlist on this.element of the caller');
        it('should set the attribute aria-pressed to false on to this.element of the caller');
        describe('if the toggleableButton options include deactivate', () => {
            it('should call call it with the toggleableButton for context');
        });
    });
});
