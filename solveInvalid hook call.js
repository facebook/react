// You cannot use useState in non functional component. You're using it in a method called HandleAdd. HandleAdd is not a component! You're using classify component. You need to move the HandleAdd into your component and use the class component's own state and setState :

class CustomToolbar extends React.Component {
    state = false;
    constructor(props) {
       super(props)
       this.HandleAdd = this.HandleAdd.bind(this);
    }
    HandleAdd = () => {
    Swal.fire({
      title: 'Add Department',
      text: "Input department name below.",
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Save',
      html: generateInputForms({
        strname: '',
        intsequence: ''
      }),
  
      preConfirm: () => {
        let strname = document.getElementById('strname').value;
        let intsequence = document.getElementById('intsequence').value;
   
        if (!strname) {
          Swal.showValidationMessage('The Department field is required.')
        }
        if (!intsequence) {
          Swal.showValidationMessage('The Sequence field is required.')
        }
        return {
          strname: document.getElementById('strname').value,
          intsequence: document.getElementById('intsequence').value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        let request = {
          strresourcename: "Richard",
          strapplicationcode: "SchoolApp",
          strmodulename: "Department",
          strtablename: "fmDepartments",
          strfieldid: "fmDepartmentsId",
          strname:document.getElementById('strname').value,
          intsequence:document.getElementById('intsequence').value
        }
        addDepartment(request).then(function(res){
          if (res.status == 200){
            Swal.fire({
              icon: 'success',
              title: 'Department',
              text: 'New Department has been added successfully.',
            }).then((res) => {
              this.setState(!this.state);
            })
          }else{
            Swal.fire({
              icon: 'error',
              title: 'Oops',
              text: 'Something went wrong.',
            })
          }
        })
            
      }
    })
  }
  
  
    handleClick = () => {
      console.log("Add User Initiated...");
    }
  
    render() {
      const { classes } = this.props;
  
      return (
        <React.Fragment>
          <Tooltip title={"Add"}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                style={{
                  textTransform: 'unset',
                  outline: 'none',
                  marginLeft: 20,
                  backgroundColor: '#00B029',
                }}
                onClick={this.HandleAdd}
                className={classes.button}
                startIcon={<AddIcon className={classes.addIcon} style={{color: '#fff',}} />}
              >
                Add
              </Button>
          </Tooltip>
        </React.Fragment>
      );
    }
  
  }