# `@sewing-kit/model`
The sewing-kit model is based on the concepts of a Project and Workspace. A Project can be a Package, WebApp, or Service.  Each type of Project has configurable options. A Workspace can then be made up any combination of Packages, WebApps or Services.

## Installation
```
yarn add @sewing-kit/model --dev
```

## Usage

### Workspace

`projects()` gets all of the projects defined in the workspace

`private()` A workspace is defined as private if it contains a WebApp or Service project. Package workspaces, with package projects only, that may be published, would not be considered private.

### Project

A project consists of a name, and a root folder containing a `package.json` defining its dependencies.

`id()` returns the id for the project. A project id is derived from the name and prefixed with the type of project (Package, WebApp or Service).  For example, `'WebApp.myProject'`.

