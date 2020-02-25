describe('User actions', () => {
    beforeEach(() => {
        cy.server();
        cy.route('POST', '**/machinelearning/user/actions', 'fx:user_actions');
        cy.route('POST', '**/rest/search/v2*', 'fx:user_clicked_document');
        cy.visit('/pages/user_actions.html');
    });

    describe('When I click on the user actions button', () => {
        beforeEach(() => {
            cy.get('.coveo-main-section').should('be.visible');
            cy.get('.coveo-user-actions-dropdown-header')
                .should('be.visible')
                .click();
        });

        it('should hide user actions panel when I click on the user actions button', () => {
            cy.get('.coveo-user-actions-dropdown-header').click();
            cy.get('.CoveoUserActions').should('not.be.visible');
        });

        it('should hide the main panel', () => {
            cy.get('.coveo-main-section').should('not.be.visible');
        });

        it('should display user activity', () => {
            cy.get('.CoveoUserActivity').should('be.visible');

            cy.get('.coveo-activity > .coveo-search')
                .should('be.visible')
                .should('contain', 'some_query');

            cy.get('.coveo-activity > .coveo-click')
                .should('be.visible')
                .should('contain', 'some_document_title');
        });

        it('should display user clicked document', () => {
            cy.get('.CoveoClickedDocumentList')
                .should('be.visible')
                .should('contain', 'some_document_title');
        });

        it('should display user queries', () => {
            cy.get('.CoveoQueryList')
                .should('be.visible')
                .should('contain', 'some_query');
        });
    });
});
