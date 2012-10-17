//
//  MyClass.h
//  AutonetMobile
//
//  Created by Jeremy Ellison on 10/12/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <PhoneGap/PGPlugin.h>

@interface TemporaryAlert : PGPlugin {
    
}

- (void) show:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

- (void) exit:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end
