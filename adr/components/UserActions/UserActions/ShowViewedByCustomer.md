# showViewedByCustomer Method (SFINT-2519)

## Admin

-   **Author:** Neil Wadden
-   **Deciders:** Louis Bompart, Nathan Lafrance-Berger, Andre Theriault, Jeremie Robert
-   **Date:** 10/10/2019
-   **JIRA:** SFINT-2519
-   **User Story:** https://coveord.atlassian.net/browse/SFINT-2519

---

## Context and Problem Statement

<!-- Quick 2-3 sentence background of the User Story -->

The `ViewedByCustomer` component needs to be added on each result template, and therefore could be accidentally missed on one or more, especially if a new template is added at a later time. This would create an inconsistent view of what content the customer has viewed. - From JIRA

---

## Decision Drivers <!-- optional -->

<!-- Number these so that they are easier to reference in the following section -->

1. Need to choose when to edit the results (i.e. need an event)
1. Ensure the `ViewedByCustomer` component is properly added to each result template
1. Ensure that if a template already has the `ViewedByCustomer` component that it won't add a second component
1. There should be an option whether or not to perform that aforementioned actions with the component

---

## Considered Options

<!-- Give some options regarding the decision drivers mentions in the previous section -->

**Decision 1** - What event should be used

-   [Option 1] - Leverage the `newResultsDisplayed` event, and loop over every result, performing further action.
-   [Option 2] - Leverage the `newResultDisplayed` event, and perform further action.

**Decision 2** - Properly adding the ViewedByDocument Component

-   [Option 1] - Add the component using `<div class="CoveoViewedByCustomer">`.
-   [Option 2] - Add the component using the `ViewedByCustomer` constructor.

**Decision 3** - Ensure we don't add the template a second time

-   [Option 1] - Query the results `HTMLElement` using the `getElementsByClassName` method.
-   [Option 2] - Query the results `HTMLElement` using the `querySelectorAll` method.

**Decision 4** - There should be an option whether or not to add the component

-   [Option 1] - Have the option be false by default.
-   [Option 2] - Have the option be true by default.

---

## Decision Outcome

#### Decision 1: [Option 2]

There are two reason behind this decision selection: First the `newResultsDisplayed` option wasn't passing back the `args.item`, which would have made editing the dom element harder. Second, using the event trigger instead of a for loop made the methods functionality more simple.

#### Decision 2: [Option 2]

The `newResultDisplayed` dom element was firing after the completion of the search-ui, therefore using the `<div>` wasn't possible.

#### Decision 3: [Option 1]

Choosing to use `getElementsByClassName`, in this context I don't think there is a difference between using `querySelectorAll` and `getElementsByClassName`

#### Decision 4: [Option 2]

From what I understand it makes sense for this feature to be true by default, as it's important for their not to be inconsistencies

---

## Pros & Cons

### Pros

-   Using the `newResultsDisplayed` method offers an effective way to make dynamic changes to the reuslts, and the functionality of this function could easily be expanded on

### Cons

-   Having to call the constructor of `ViewedByCustomer` is a little sketchy. From what I can tell it's not being done anywhere else in the code. It means that a change in the ViewedByCustomer component could negatively affect this method

---

## Related Links

-   **search-ui-extensions PR**: https://github.com/coveo/search-ui-extensions/pull/45
-   **salesforceIntegrationV2 PR**: https://bitbucket.org/coveord/salesforceintegrationv2/pull-requests/1470/

---
