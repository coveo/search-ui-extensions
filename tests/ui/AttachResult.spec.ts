import { AttachResult, IAttachResultOptions } from "../../src/ui/AttachResult/AttachResult";
import { Mock, Fake, Simulate } from "coveo-search-ui-tests";
import { $$, InitializationEvents, QueryEvents, IBuildingQueryEventArgs, IQueryResult } from "coveo-search-ui";

describe("AttachResult", () => {
    let attachResult: Mock.IBasicComponentSetup<AttachResult>;
    let fakeResult = Fake.createFakeResult();

    beforeEach(() => {
        attachResult = Mock.basicResultComponentSetup<AttachResult>(AttachResult);
    });

    afterEach(() => {
        attachResult = null;
    });

    it("should have two children elements", () => {
        expect(attachResult.cmp.element.childNodes.length).toBe(2);
        expect(attachResult.cmp.element.querySelector(".coveo-caption-for-icon")).not.toBeNull();
        expect(attachResult.cmp.element.querySelector(".coveo-icon-attach")).not.toBeNull();
    });

    describe("when configuring isAttached", () => {
        let faker;
        let isAttachedSpy : jasmine.Spy;
        beforeEach(() => {
            faker = {
                isAttachedMock: function(result : IQueryResult) {
                    return Promise.resolve(true);
                }
            };

            isAttachedSpy = spyOn(faker, "isAttachedMock").and.callThrough();
        });

        it("should call isAttached on initialize", () => {
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttachedMock }, fakeResult);
            expect(faker.isAttachedMock).toHaveBeenCalledWith(fakeResult);
        });

        it("should be attached when isAttached returns true", (done) => {
            isAttachedSpy.and.returnValue(Promise.resolve(true));
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttachedMock }, fakeResult);
            setTimeout(() => {
                expect(attachResult.cmp.isAttached()).toBeTruthy();
                done();
            }, 50);
        });

        it("should be detached when isAttached returns false", (done) => {
            isAttachedSpy.and.returnValue(Promise.resolve(false));
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttachedMock }, fakeResult);
            setTimeout(() => {
                expect(attachResult.cmp.isAttached()).toBeFalsy();
                done();
            }, 50);
        });

        it("should be detached when isAttached throws", (done) => {
            isAttachedSpy.and.returnValue(Promise.reject("error"));
            attachResult = Mock.optionsResultComponentSetup(AttachResult, { isAttached: faker.isAttachedMock }, fakeResult);
            setTimeout(() => {
                expect(attachResult.cmp.isAttached()).toBeFalsy();
                done();
            }, 50);
        });
    })

    describe("attach", () => {
        let faker
        let attachSpy : jasmine.Spy;
        beforeEach((done) => {
            faker = {
                attach: function(result : IQueryResult) {
                    return Promise.resolve();
                }
            }

            attachSpy = spyOn(faker, "attach").and.callThrough();

            attachResult = Mock.optionsResultComponentSetup(AttachResult, {
                attach: faker.attach,
                detachCaption: "detach me",
                attachCaption: "attach me"
            }, fakeResult);

            attachResult.cmp.detach().then(() => { done(); });
        });

        it("should only attach if not attached", (done) => {
            attachResult.cmp.attach()
                .then(() => {
                    expect(faker.attach).toHaveBeenCalledWith(fakeResult);
                    return attachResult.cmp.attach();
                })
                .then(() => {
                    expect(faker.attach).toHaveBeenCalledTimes(1);
                    done();
                });;
        });

        it("should not change state if attach fails", (done) => {
            attachSpy.and.returnValue(Promise.reject("error"));

            expect(attachResult.cmp.isAttached()).toBeFalsy();
            attachResult.cmp.attach()
                .catch(error => {
                    expect(error).toBe("error");
                    expect(attachResult.cmp.isAttached()).toBeFalsy();
                    done();
                });
        });

        it("should have the correct css class", (done) => {
            attachResult.cmp.attach()
                .then(() => {
                    expect(attachResult.cmp.element.querySelector(".coveo-icon-attached")).not.toBeNull();
                    done();
                });
        });

        it("should display the correct tooltip", (done) => {
            expect(attachResult.cmp.element.querySelector(".coveo-caption-for-icon").innerHTML).toBe("attach me");
            attachResult.cmp.attach()
                .then(() => {
                    expect(attachResult.cmp.element.querySelector(".coveo-caption-for-icon").innerHTML).toBe("detach me");
                    done();
                });
        });
    });

    describe("detach", () => {
        let faker;
        let detachSpy : jasmine.Spy;
        beforeEach((done) => {
            faker = {
                detach: function(result : IQueryResult) {
                    return Promise.resolve();
                }
            }

            detachSpy = spyOn(faker, "detach").and.callThrough();

            attachResult = Mock.optionsResultComponentSetup(AttachResult, {
                detach: faker.detach,
                detachCaption: "detach me",
                attachCaption: "attach me"
            }, fakeResult);

            attachResult.cmp.attach().then(() => { done(); });
        });

        it("should only detach if attached", (done) => {
            attachResult.cmp.detach()
                .then(() => {
                    expect(faker.detach).toHaveBeenCalledWith(fakeResult);
                    return attachResult.cmp.detach();
                })
                .then(() => {
                    expect(faker.detach).toHaveBeenCalledTimes(1);
                    done();
                });;
        });

        it("should not change state if attach fails", (done) => {
            detachSpy.and.returnValue(Promise.reject("error"));

            expect(attachResult.cmp.isAttached()).toBeTruthy();
            attachResult.cmp.detach()
                .catch(error => {
                    expect(error).toBe("error");
                    expect(attachResult.cmp.isAttached()).toBeTruthy();
                    done();
                });
        });

        it("should have the correct css class", (done) => {
            attachResult.cmp.detach()
                .then(() => {
                    expect(attachResult.cmp.element.querySelector(".coveo-icon-attach")).not.toBeNull();
                    done();
                });
        });

        it("should display the correct tooltip", (done) => {
            expect(attachResult.cmp.element.querySelector(".coveo-caption-for-icon").innerHTML).toBe("detach me");
            attachResult.cmp.detach()
                .then(() => {
                    expect(attachResult.cmp.element.querySelector(".coveo-caption-for-icon").innerHTML).toBe("attach me");
                    done();
                });
        });
    });

    describe("click", () => {
        let faker;
        beforeEach(() => {
            faker = {
                attach: function(result : IQueryResult) {
                    return Promise.resolve();
                },
                detach: function(result : IQueryResult) {
                    return Promise.resolve();
                }
            }

            spyOn(faker, "attach").and.callThrough();
            spyOn(faker, "detach").and.callThrough();

            attachResult = Mock.optionsResultComponentSetup(AttachResult, {
                attach: faker.attach,
                detach: faker.detach
            }, fakeResult);
        });

        it("should attach when it is not attached", (done) => {
            expect(attachResult.cmp.isAttached()).toBeFalsy();
            attachResult.cmp.element.click();
            setTimeout(() => {
                expect(attachResult.cmp.isAttached()).toBeTruthy();
                done();
            }, 50);
        });
        
        it("should detach when it is attached", (done) => {
            attachResult.cmp.attach()
                .then(() => {
                    expect(attachResult.cmp.isAttached()).toBeTruthy();
                    attachResult.cmp.element.click();
                    setTimeout(() => {
                        expect(attachResult.cmp.isAttached()).toBeFalsy();
                        done();
                    }, 50);
                });
        });
    });
});
