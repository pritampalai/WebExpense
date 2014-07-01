App = Ember.Application.create({
   LOG_TRANSITIONS: true
});

App.ApplicationAdapter = DS.LSAdapter.extend({
  namespace: 'sample'
});

var expenditure = [{
  id: '1',
  date: '12-27-2012',
  desc:"Lunch",
  whopaid:"Pritam",
  amount:'1500.00',
  forwhom:"Pritam,Punam"
  },{
  id: '2',
  date: '12-29-2012',
  desc:"Dinner",
  whopaid:"Punam",
  amount:'2500.00',
  forwhom:"Pritam,Punam"
  }];

App.Router.map(function() {
  this.resource('summary');
  this.resource('expenses', function() {
    this.resource('viewexpense', function() {
	  this.resource('expense', {path: ':expense_id' });
	});
  });
  this.resource('create', function() {
    this.resource('viewperson', function() {
      this.resource('eachuser', { path: ':eachuser_id' });
	});	
	this.resource('users', function() {
	  this.resource('user', {path: ':user_id'}, function() {
	    this.route('edit');
	  });
	  this.route('createuser');
	});  
  });
});

App.Person = DS.Model.extend( { 
    name         : DS.attr('string'),
    dname        : DS.attr('string'),
    desc         : DS.attr('string'),
	creationDate : DS.attr('date')           
});

App.UsersRoute = Ember.Route.extend({
   model: function(){  
      var users = this.get('store').findAll('person');	  
	  return users;      
   }   
});

App.UsersController = Ember.ArrayController.extend({
   sortProperties: ['creationDate'],
   sortAscending: true,
      
   usersCount: function(){
      return this.get('model.length');
   }.property('@each')           
    
});

App.UserRoute = Ember.Route.extend({
   model: function(params){
      this.get('store').find('model', lkqso).then(function(rec){
          rec.deleteRecord();
      });
        var store = this.get('store');
		return store.find('person',params.person_id); 
		     
   }
});

App.UserController = Ember.ObjectController.extend({
   deleteMode: false,
           
   actions: {
      delete: function(){
         this.toggleProperty('deleteMode');
      },
      cancelDelete: function(){         
         this.set('deleteMode', false);
      },
      confirmDelete: function(){         
         this.get('model').deleteRecord();
         this.get('model').save();        
         this.transitionToRoute('users');        
         this.set('deleteMode', false);
      },
      edit: function(){
         this.transitionToRoute('user.edit');
      }
   }
});

App.UserEditRoute = Ember.Route.extend({
   model: function(){ 
      return this.modelFor('user');
   }
});    

App.UserEditController = Ember.ObjectController.extend({
   actions: {
       save: function(){
            var user = this.get('model');
            user.save();
            this.transitionToRoute('user', user);
       }
   }
});

App.UsersCreateuserRoute = Ember.Route.extend({
   model: function(){  
      var store = this.get('store');
		return store.createRecord('person',this.get('model'));      
   },

   renderTemplate: function(){
      this.render('user.edit', {
          controller: 'usersCreateuser'
      });
   }
});
        
App.UsersCreateuserController = Ember.ObjectController.extend({
    actions: {
        save: function () {    
            this.get('model').set('creationDate', new Date());
			this.get('model').save();			            
            this.transitionToRoute('users');
        }
    }
});










App.ViewexpenseRoute = Ember.Route.extend({
  model: function() {
    return expenditure;
  }
});

App.ExpenseRoute = Ember.Route.extend({
  model: function(params) {
    return expenditure.findBy('id', params.expense_id);	
  }
});

App.ExpenseController = Ember.ObjectController.extend({
  isEditing: false,      
   
  edit: function() {
    this.set('isEditing', true);
  },

  doneEditing: function() {
    this.set('isEditing', false);
    this.get('store').commit();
  }
});






App.ViewpersonRoute = Ember.Route.extend({
  model: function() {
    var users = this.get('store').findAll('person');	
	return users;
  }
});

App.EachuserRoute = Ember.Route.extend({
  model: function(params) {
    var store = this.get('store');
		return store.find('person',params.person_id);
  }
});

App.EachuserController = Ember.ObjectController.extend({
  isEditing: false,

  edit: function() {
    this.set('isEditing', true);
  },

  doneEditing: function() {
    this.set('isEditing', false);
    this.get('store').commit();
  }
});

var showdown = new Showdown.converter();

Ember.Handlebars.helper('format-markdown', function(input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});

Ember.Handlebars.helper('format-date', function(date) {
  return moment(date).fromNow();
});
