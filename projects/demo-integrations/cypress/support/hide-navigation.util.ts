export const hideNavigation = () => {
    cy.get('.tui-doc-navigation').invoke('attr', 'style', 'display: none');
    cy.get('.tui-doc-content').invoke('attr', 'style', 'margin-left: 0');
};
