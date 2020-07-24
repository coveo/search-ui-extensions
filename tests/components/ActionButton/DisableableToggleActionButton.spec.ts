describe('DisableableToggleActionButton', () => {
    describe('when disabled', () => {
        it('clicking it should do nothing');
        it('isActivated should return false');
        it('isDisabled should return true');
        describe('setEnabled', () => {
            it('should do nothing if called with false');
            it('should call enable if called with true');
        });
        describe('enable', () => {
            it('should call switchTo with the deactivatedState');
        });
        describe('disable', () => {
            it('should not call switchTo at all');
        });
        describe('setActivated', () => {
            it('should switch to deactivated if called with false');
            it('should do nothing if called with true');
        });
    });

    describe('when unactivated', () => {
        it('isActivated should return false');
        it('isDisabled should return false');

        describe('when clicked on', () => {
            it('should call the click handler and setActivated with true');
        });

        describe('setEnabled', () => {
            it('should do nothing if called with true');
            it('should call disable if called with false');
        });

        describe('enable', () => {
            it('should not call switchTo at all');
        });

        describe('disable', () => {
            it('should call switchTo with the disabledState');
        });

        describe('setActivated', () => {
            it('should do nothing if called with false');
            it('should switch to activated if called with true');
        });
    });

    describe('when unactivated', () => {
        it('isActivated should return false');
        it('isDisabled should return false');

        describe('when clicked on', () => {
            it('should call the click handler and setActivated with false');
        });

        describe('setEnabled', () => {
            it('should do nothing if called with true');
            it('should call disable if called with false');
        });

        describe('enable', () => {
            it('should not call switchTo at all');
        });

        describe('disable', () => {
            it('should call switchTo with the disabledState');
        });

        describe('setActivated', () => {
            it('should do nothing if called with false');
            it('should switch to activated if called with true');
        });
    });
});
