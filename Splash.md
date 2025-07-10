## Adding a Splash Screen to PyInstaller Generated Executables

PyInstaller provides **built-in splash screen functionality** that allows you to display a loading image while your executable is starting up[1][2]. This feature was introduced in mid-2021 and significantly improves user experience by providing visual feedback during application initialization[1][2].

### Using the Command Line Option

The simplest way to add a splash screen is using the `--splash` command line option when building your executable:

```bash
pyinstaller --splash=splash_image.png your_script.py
```

You can use either PNG or JPG image formats for the splash screen[2][3]. The splash screen will automatically display during the bootloader's file extraction and Python startup process.

### Controlling the Splash Screen in Python Code

To properly close the splash screen when your application is ready, you need to use the `pyi_splash` module in your Python code:

```python
import sys

# Check if running as PyInstaller executable
if getattr(sys, 'frozen', False):
    try:
        import pyi_splash
        
        # Update text on splash screen (optional)
        pyi_splash.update_text('Application loaded...')
        
        # Close splash screen when application is ready
        pyi_splash.close()
    except ImportError:
        pass

# Your main application code here
```

The `pyi_splash` module is only available when running as a PyInstaller-generated executable and cannot be installed via pip[4][5]. Always wrap the import in a try-except block to handle cases where the module isn't available[2][3].

### Using Spec Files for Advanced Configuration

For more advanced splash screen configuration, you should use a spec file. Create one using:

```bash
pyi-makespec --splash=splash_image.png your_script.py
```

This generates a `.spec` file with splash screen configuration that you can customize:

```python
# example.spec
import sys

a = Analysis(['your_script.py'],
             # ... other parameters
             )

splash = Splash('splash_image.png',
                binaries=a.binaries,
                datas=a.datas,
                text_pos=(50, 50),  # Text position coordinates
                text_size=12,       # Text size
                text_color='black', # Text color
                always_on_top=True, # Keep splash on top
                minify_script=True)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(pyz,
          splash,          # Include splash object
          a.scripts,
          # ... other parameters
          )
```

### Splash Screen Configuration Options

The `Splash` object accepts several configuration parameters[6][7]:

- **`text_pos`**: Tuple of (x, y) coordinates for text positioning, where (0, 0) is the bottom-left corner
- **`text_size`**: Font size for splash screen text
- **`text_color`**: Color of the text (e.g., 'black', 'white', '#FF0000')
- **`text_font`**: Font family (must be installed on target system)
- **`always_on_top`**: Boolean to keep splash screen above other windows
- **`minify_script`**: Boolean to optimize the splash screen code

### Dynamic Text Updates

You can update the splash screen text during application loading to provide progress feedback:

```python
if getattr(sys, 'frozen', False):
    try:
        import pyi_splash
        
        pyi_splash.update_text('Loading modules...')
        # Import heavy modules here
        
        pyi_splash.update_text('Initializing interface...')
        # Initialize GUI components
        
        pyi_splash.update_text('Ready!')
        # Final preparations
        
        pyi_splash.close()
    except ImportError:
        pass
```

### Common Issues and Solutions

**Splash Screen Won't Close**: Ensure you call `pyi_splash.close()` after your application is fully loaded. The splash screen remains open until explicitly closed[3][8].

**Text Not Visible**: Check text positioning coordinates and ensure the text color contrasts with your background image[9]. Text positioning uses pixel coordinates from the bottom-left corner of the image.

**Always on Top Issues**: If the main window appears behind other windows after closing the splash screen, set `always_on_top=False` in your spec file configuration[10][8].

**Spec File Required for Text**: To display text on the splash screen, you must use a spec file - the command line option alone only displays the image[11][12].

### Platform Compatibility

**Important Note**: Splash screen functionality is **incompatible with macOS** due to technical limitations with Tcl/Tk threading restrictions on that platform[13]. The feature works on Windows and Linux systems.

### Best Practices

1. **Use appropriate image sizes**: Choose images that display well at typical screen resolutions
2. **Test text positioning**: Verify text placement coordinates work across different screen sizes  
3. **Handle import errors**: Always wrap `pyi_splash` imports in try-except blocks
4. **Close at appropriate time**: Call `pyi_splash.close()` when your main application window is ready to be displayed
5. **Consider file size**: Large images increase executable size - balance visual appeal with distribution constraints

By implementing splash screens, you can significantly improve the user experience of PyInstaller-generated executables, especially for applications with longer startup times due to large dependencies or complex initialization processes[1][2].

Sources
[1] Splash Screens for your Pyinstaller EXE - YouTube https://www.youtube.com/watch?v=sKMQpy56HSY
[2] Splash Screens for your Pyinstaller EXE - CodersLegacy https://coderslegacy.com/python/splash-screen-for-pyinstaller-exe/
[3] Pyinstaller loading splash screen https://stackoverflow.com/questions/68863050/pyinstaller-loading-splash-screen/72736172
[4] command is - PyInstaller https://pyinstaller.org/en/stable/usage.html
[5] pyinstaller/doc/usage.rst at develop - GitHub https://github.com/pyinstaller/pyinstaller/blob/develop/doc/usage.rst
[6] Using Spec Files https://pyinstaller.org/en/v5.13.1/spec-files.html
