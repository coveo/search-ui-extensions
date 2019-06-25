import { AttachResult, IAttachResultOptions } from '../../src/components/AttachResult/AttachResult';
import { Mock, Fake } from 'coveo-search-ui-tests';
import { IQueryResult } from 'coveo-search-ui';

describe('AttachResult', () => {
    let attachResult: Mock.IBasicComponentSetup<AttachResult>;
    let fakeResult = Fake.createFakeResult();

    beforeEach(() => {
        attachResult = Mock.basicResultComponentSetup<AttachResult>(AttachResult);
    });

    afterEach(() => {
        attachResult = null;
    });

    it('should have two children elements', () => {
        expect(attachResult.cmp.element.childNodes.length).toBe(2);
        expect(attachResult.cmp.element.querySelector('.coveo-caption-for-icon')).not.toBeNull();
        expect(attachResult.cmp.element.querySelector('.coveo-icon-attach')).not.toBeNull();
    });

    describe('when configuring isAttached', () => {
        let faker: IAttachResultOptions;
        let isAttachedSpy: jasmine.Spy;
        beforeEach(() => {
            faker = {
                isAttached: function(result: IQueryResult) {
                    return Promise.resolve(true);
                }
            };

            isAttachedSpy = spyOn(faker, 'isAttached').and.callThrough();
        });

        it('should call isAttached on initialize', () => {
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttached }, fakeResult);
            expect(faker.isAttached).toHaveBeenCalledWith(fakeResult);
        });

        it('should be attached when isAttached returns true', done => {
            isAttachedSpy.and.returnValue(Promise.resolve(true));
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttached }, fakeResult);
            setTimeout(() => {
                expect(attachResult.cmp.isAttached()).toBeTruthy();
                done();
            }, 50);
        });

        it('should be detached when isAttached returns false', done => {
            isAttachedSpy.and.returnValue(Promise.resolve(false));
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttached }, fakeResult);
            setTimeout(() => {
                expect(attachResult.cmp.isAttached()).toBeFalsy();
                done();
            }, 50);
        });

        it('should be detached when isAttached throws', done => {
            isAttachedSpy.and.returnValue(Promise.reject('error'));
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttached }, fakeResult);
            setTimeout(() => {
                expect(attachResult.cmp.isAttached()).toBeFalsy();
                done();
            }, 50);
        });
    });

    describe('attach', () => {
        let faker: IAttachResultOptions;
        let attachSpy: jasmine.Spy;
        beforeEach(done => {
            faker = {
                attach: function(result: IQueryResult) {
                    return Promise.resolve();
                }
            };

            attachSpy = spyOn(faker, 'attach').and.callThrough();

            attachResult = Mock.optionsResultComponentSetup(
                AttachResult,
                {
                    attach: faker.attach,
                    detachCaption: 'detach me',
                    attachCaption: 'attach me'
                },
                fakeResult
            );

            attachResult.cmp.detach().then(() => {
                done();
            });
        });

        it('should only attach if not attached', async () => {
            await attachResult.cmp.attach();
            expect(faker.attach).toHaveBeenCalledWith(fakeResult);
            await attachResult.cmp.attach();
            expect(faker.attach).toHaveBeenCalledTimes(1);
        });

        it('should not change state if attach fails', done => {
            attachSpy.and.returnValue(Promise.reject('error'));

            expect(attachResult.cmp.isAttached()).toBeFalsy();
            attachResult.cmp.attach().catch(error => {
                expect(error).toBe('error');
                expect(attachResult.cmp.isAttached()).toBeFalsy();
                done();
            });
        });

        it('should have the correct css class', async () => {
            await attachResult.cmp.attach();
            expect(attachResult.cmp.element.querySelector('.coveo-icon-attached')).not.toBeNull();
        });

        it('should display the correct tooltip', async () => {
            expect(attachResult.cmp.element.querySelector('.coveo-caption-for-icon').innerHTML).toBe('attach me');
            await attachResult.cmp.attach();
            expect(attachResult.cmp.element.querySelector('.coveo-caption-for-icon').innerHTML).toBe('detach me');
        });
    });

    describe('detach', () => {
        let faker: IAttachResultOptions;
        let detachSpy: jasmine.Spy;
        beforeEach(done => {
            faker = {
                detach: function(result: IQueryResult) {
                    return Promise.resolve();
                }
            };

            detachSpy = spyOn(faker, 'detach').and.callThrough();

            attachResult = Mock.optionsResultComponentSetup(
                AttachResult,
                {
                    detach: faker.detach,
                    detachCaption: 'detach me',
                    attachCaption: 'attach me'
                },
                fakeResult
            );

            attachResult.cmp.attach().then(() => {
                done();
            });
        });

        it('should only detach if attached', async () => {
            await attachResult.cmp.detach();
            expect(faker.detach).toHaveBeenCalledWith(fakeResult);
            await attachResult.cmp.detach();
            expect(faker.detach).toHaveBeenCalledTimes(1);
        });

        it('should not change state if attach fails', done => {
            detachSpy.and.returnValue(Promise.reject('error'));

            expect(attachResult.cmp.isAttached()).toBeTruthy();
            attachResult.cmp.detach().catch(error => {
                expect(error).toBe('error');
                expect(attachResult.cmp.isAttached()).toBeTruthy();
                done();
            });
        });

        it('should have the correct css class', async () => {
            await attachResult.cmp.detach();
            expect(attachResult.cmp.element.querySelector('.coveo-icon-attach')).not.toBeNull();
        });

        it('should display the correct tooltip', async () => {
            expect(attachResult.cmp.element.querySelector('.coveo-caption-for-icon').innerHTML).toBe('detach me');
            await attachResult.cmp.detach();
            expect(attachResult.cmp.element.querySelector('.coveo-caption-for-icon').innerHTML).toBe('attach me');
        });
    });

    describe('click', () => {
        beforeEach(() => {
            attachResult = Mock.optionsResultComponentSetup(AttachResult, {}, fakeResult);
        });

        it('should attach when it is not attached', () => {
            let attachSpy = spyOn(attachResult.cmp, 'attach');
            expect(attachResult.cmp.isAttached()).toBeFalsy();
            attachResult.cmp.element.click();
            expect(attachSpy).toHaveBeenCalled();
        });

        it('should detach when it is attached', async () => {
            let detachSpy = spyOn(attachResult.cmp, 'detach');
            await attachResult.cmp.attach();
            expect(attachResult.cmp.isAttached()).toBeTruthy();
            attachResult.cmp.element.click();
            expect(detachSpy).toHaveBeenCalled();
        });
    });
});
