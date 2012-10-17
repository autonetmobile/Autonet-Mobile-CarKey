//
//  MyClass.m
//  AutonetMobile
//
//  Created by Jeremy Ellison on 10/12/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "TemporaryAlert.h"


@implementation TemporaryAlert

- (void)show:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options {
    NSLog(@"Temporary Alert: %@", arguments);
    NSString* callbackID = [arguments pop];
    
    UIAlertView* alert = [[UIAlertView alloc] initWithTitle:@"Alert" message:[arguments objectAtIndex:0] delegate:nil cancelButtonTitle:@"OK" otherButtonTitles:nil];
    [alert show];
    [self performSelector:@selector(dismissAlert:) withObject:alert afterDelay:5];
    
    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_OK];
    [self writeJavascript: [pluginResult toSuccessCallbackString:callbackID]];
}

- (void)dismissAlert:(UIAlertView*)alert {
    NSLog(@"Dismiss");
    [alert dismissWithClickedButtonIndex:0 animated:YES];
    [alert release];
}

- (void)exit:(NSMutableArray*)args withDict:(NSMutableDictionary*)opts {
    exit(0);
}

@end
